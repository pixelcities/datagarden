import { EnhancedStore } from '@reduxjs/toolkit'

import { ExecutionError, User, DataSpace, Task, Collection, Schema, Concept, Share, WAL } from 'types'
import { RootState } from 'state/store'
import { shareSecret, createMetadata, updateCollectionSchema, updateTransformerWAL, shareMPCPartial } from 'state/actions'

import { writeRemoteTable } from 'utils/writeRemoteTable'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { buildQuery } from 'utils/query'
import { emptyTaxonomy } from 'utils/taxonomy'
import { signSchema, verifySchema } from 'utils/integrity'
import { toHex } from 'utils/helpers'


export const handleTask = (task: Task, user: User, dataSpace: DataSpace, store: EnhancedStore<RootState>, keyStore: any, protocol: any, arrow: any, dataFusion: any) => {
  return new Promise<{actions: any[], metadata: {[key: string]: any}, completed_fragments?: string[]}>((resolve, reject) => {
    const instruction = task.task["instruction"]
    const transformer_id = task.task["transformer_id"]
    const wal: WAL = task.task["wal"]

    const transformer = store.getState().transformers.entities[transformer_id]
    const collections = transformer?.collections.map(id => store.getState().collections.entities[id]) ?? []
    const metadata = Object.values(store.getState().metadata.entities).reduce((a, b) => ({...a, [b?.id ?? ""]: b?.metadata}), {})
    const concepts = Object.values(store.getState().concepts.entities).filter((x): x is Concept => !!x).reduce((a: {[key: string]: Concept}, b) => ({...a, [b.id]: b}), {})

    if (!transformer) {
      reject([ExecutionError.Retry, undefined])
      return
    }

    if (store.getState().secrets.ids.length > 0) {
      reject([ExecutionError.Retry, undefined])
      return
    }

    console.log("Received a transformer task: ", task.task)

    if (instruction === "compute_fragment") {
      const target_id = task.task["collection_id"]
      const fragments: string[] = JSON.parse(JSON.stringify(task.fragments))
      const task_meta = task.metadata

      const target = store.getState().collections.entities[target_id]

      // Load all the input collections in memory
      Promise.all(collections.map((collection) => {
        return new Promise<void>((resolve, reject) => {
          if (!collection || !collection.id || !collection.uri) {
            reject("Failed to load data")
            return
          }

          // Filter the fragments for this particular table
          const requestedFragments = fragments.filter(f => collection.schema.column_order.indexOf(f) !== -1)

          // Nothing to do
          if (requestedFragments.length === 0) {
            resolve()
            return
          }

          if (dataFusion?.table_exists(collection.id)) {
            // If the table is already loaded, we still need to validate if it has the right columns
            // in memory. If this table was loaded a long time ago, it could have fewer columns than
            // the current transformer is expecting.
            const fields = dataFusion?.get_schema(collection.id).fields.map((field: any) => field.name)

            // Check if all the expected fragements are encountered for
            if (requestedFragments.filter(f => fields.indexOf(f) === -1).length === 0) {
              resolve()
              return
            }

            // If not, drop this version of the table and fallback to loading a fresh copy
            dataFusion?.drop_table(collection.id)
          }

          loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore, fragments).then(() => resolve()).catch(() => reject("Error loading remote table"))
        })
      })).then(() => {
        // Handle transformer tasks with just one input collection
        if (transformer.type !== "merge" && transformer.type !== "privatise" && transformer.type !== "mpc") {
          const collection = collections[0]

          if (collection && target) {
            // Verify schema before doing anything
            verifySchema(collection.schema, keyStore.get_key(collection.schema.key_id)).then(schemaIsValid => {
              if (!schemaIsValid) {
                reject([ExecutionError.Integrity, "Cannot validate schema integrity"])
                return
              }

              // Create a copy, in case the user was looking at this collection
              const id = dataFusion?.clone_table(collection.id, transformer_id)
              const oldSchema: Schema = JSON.parse(JSON.stringify(collection.schema))

              // Validate that the working table has *exactly* the expected amount of columns. It is possible
              // to have more columns loaded when it was already loaded in memory and this transformer task
              // is executing with a set of fragments that is a subset of the table columns. We can safely drop
              // these columns from the clone.
              const extraFields = dataFusion?.get_schema(id).fields
                .map((field: any) => field.name)
                .filter((columnId: string) => fragments.indexOf(columnId) === -1)

              if (extraFields.length > 0) {
                dataFusion?.drop_columns(id, extraFields)
              }

              // Optionally drop a column from the schema
              const dropIds = Object.values(wal.identifiers).filter(id => id.type === "column" && id.action === "drop").map(id => id.id)
              if (dropIds.length > 0 && !("schema" in task_meta)) {
                dataFusion?.drop_columns(id, dropIds)

                oldSchema.column_order = oldSchema.column_order.filter(c => dropIds.indexOf(c) === -1)
                oldSchema.columns = oldSchema.columns.filter(c => dropIds.indexOf(c.id) === -1)
              }

              // Optionally add a column to the schema
              const newColumns = Object.values(wal.identifiers).filter(id => id.type === "column" && id.action === "add")
              if (newColumns.length > 0 && !("schema" in task_meta)) {
                // New columns are never part of the task fragments, so we have to add it here
                for (const column of newColumns) {
                  fragments.push(column.id)
                }

                oldSchema.column_order = [...oldSchema.column_order, ...newColumns.map(x => x.id)]
                oldSchema.columns = [
                  ...oldSchema.columns,
                  ...newColumns.map(x => {
                    return {
                      id: x.id,
                      concept_id: x.params![0],
                      lineage: null,
                      key_id: "", // Will be generated later
                      shares: oldSchema.shares // Inherit the schema shares for new (and empty) columns by default
                    }
                  })
                ]
              }

              // Optionally alter a column in the schema
              const alterColumns = Object.values(wal.identifiers).filter(id => id.type === "column" && id.action === "alter")
              if (alterColumns.length > 0 && !("schema" in task_meta)) {
                oldSchema.columns = oldSchema.columns.map(column => {
                  const alteredColumn = alterColumns.find(id => id.id === column.id)

                  // Just have to update the concept
                  if (alteredColumn) {
                    return {...column, ...{
                      concept_id: alteredColumn.params![0]
                    }}
                  } else {
                    return column
                  }
                })
              }

              // Build a new schema, including new keys
              rebuildSchema(id, target, collection.id, oldSchema, [], fragments, task_meta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {

                // If this is an aggregate transformer, we need to include the appropiate aggregate function
                // in the schema metadata, so that datafusion can use it for non active columns.
                if (transformer.type === "aggregate") {
                  const arrow_schema = dataFusion?.get_schema(id)
                  const fields = arrow_schema.fields.map((field: any) => {
                    const fullColumn = collection.schema.columns.find(column => field.name === column.id)
                    const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[fullColumn?.concept_id ?? ""])
                    const defaultAggregateFn = (maybe_concept && maybe_concept.aggregateFn) || "array_agg"

                    return {...field, ...{
                      metadata: {
                        aggregate_fn: defaultAggregateFn
                      }
                    }}
                  })

                  dataFusion?.update_schema(id, {...arrow_schema, ...{fields: fields}})
                }

                // Look at the requested fragments, and determine if this requires executing the
                // real query or if we can simply use the artifact.
                let identifiers: string[] = []
                for (const transaction of wal.transactions) {
                  for (const match of transaction.matchAll(/%([0-9]+)\$I/g)) {
                    if (match[1]) {
                      const identifier = wal.identifiers[Number(match[1])]
                      if (identifier) {
                        identifiers.push(identifier.id)
                      }
                    }
                  }
                }

                const nrFragments = fragments.filter(f => !!identifiers.find(id => id === f))
                const useArtifacts = nrFragments.length === 0

                execute(id, wal, fragments, useArtifacts, true, dataFusion, metadata, dataSpace, keyStore).then(() => {
                  const uri = task.task["uri"]

                  // Update the schema to reflect the new columns, and drop the old
                  updateSchema(id, fragments, renames, dataFusion)

                  // And finally, save the table to s3
                  writeRemoteTable(id, uri, schema, user, arrow, dataFusion, keyStore).then(() => {
                    resolve({
                      actions: actions,
                      metadata: meta
                    })
                  }).catch(() => {
                    reject([ExecutionError.Failure, "Error saving table"])
                    return
                  })
                })
              })
            })
          }

        // Handle merge transformers by simply creating up to two tables
        } else if (transformer.type === "merge") {
          const uri = task.task["uri"]

          // Ensure the input collections are sorted based on the wal identifiers
          let ids: {[key: string]: string} = {}
          Object.entries(wal.identifiers).forEach(([i, id]) => ids[id.id] = i)
          const sortedCollections = collections.sort((a, b) => ids[a!.id] > ids[b!.id] ? 1 : -1)

          const leftCollection = sortedCollections[0]
          const rightCollection = sortedCollections[1]

          if (leftCollection && rightCollection && target) {
            verifySchema(leftCollection.schema, keyStore.get_key(leftCollection.schema.key_id)).then(leftSchemaIsValid => {
              verifySchema(rightCollection.schema, keyStore.get_key(rightCollection.schema.key_id)).then(rightSchemaIsValid => {
                if (!leftSchemaIsValid || !rightSchemaIsValid) {
                  reject([ExecutionError.Integrity, "Cannot validate schema integrity"])
                  return
                }

                // Split the fragments in left and right
                const leftFragments = fragments.filter(f => leftCollection.schema.column_order.indexOf(f) !== -1)
                const rightFragments = fragments.filter(f => rightCollection.schema.column_order.indexOf(f) !== -1)

                // Apply the left artifacts, this possibly also handles the case where both have fragments
                if (leftFragments.length > 0) {
                  const leftId = dataFusion?.clone_table(leftCollection.id, "")

                  // If there are extra fields, drop them
                  const extraLeftFields = dataFusion?.get_schema(leftId).fields
                    .map((field: any) => field.name)
                    .filter((columnId: string) => leftFragments.indexOf(columnId) === -1)

                  if (extraLeftFields.length > 0) {
                    dataFusion?.drop_columns(leftId, extraLeftFields)
                  }

                  rebuildSchema(leftId, target, leftCollection.id, leftCollection.schema, rightCollection.schema.shares, leftFragments, task_meta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
                    execute(leftId, wal, fragments, true, true, dataFusion, metadata, dataSpace, keyStore).then(() => {
                      updateSchema(leftId, leftFragments, renames, dataFusion)

                      writeRemoteTable(leftId, uri, schema, user, arrow, dataFusion, keyStore).then(() => {

                        // If there are no more right fragments, just return
                        if (rightFragments.length === 0) {
                          resolve({
                            actions: actions,
                            metadata: meta
                          })

                        // If there were both left AND right fragments, it's a special case. We need to pass on the
                        // updated metadata and be sure to merge the resulting actions.
                        } else {
                          const rightId = dataFusion?.clone_table(rightCollection.id, "")
                          const extraRightFields = dataFusion?.get_schema(rightId).fields
                            .map((field: any) => field.name)
                            .filter((columnId: string) => rightFragments.indexOf(columnId) === -1)

                          if (extraRightFields.length > 0) {
                            dataFusion?.drop_columns(rightId, extraRightFields)
                          }

                          const leftActions = actions
                          const leftMeta = meta

                          rebuildSchema(rightId, target, rightCollection.id, rightCollection.schema, leftCollection.schema.shares, rightFragments, leftMeta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
                            execute(rightId, wal, fragments, true, false, dataFusion, metadata, dataSpace, keyStore).then(() => {
                              updateSchema(rightId, rightFragments, renames, dataFusion)

                              writeRemoteTable(rightId, uri, schema, user, arrow, dataFusion, keyStore)

                              resolve({
                                actions: [...leftActions, ...actions],
                                metadata: meta
                              })
                            })
                          })
                        }
                      })
                    })
                  })

                // Apply the right artifacts (if there were no left fragments)
                } else {
                  const rightId = dataFusion?.clone_table(rightCollection.id, "")
                  const extraRightFields = dataFusion?.get_schema(rightId).fields
                    .map((field: any) => field.name)
                    .filter((columnId: string) => rightFragments.indexOf(columnId) === -1)

                  if (extraRightFields.length > 0) {
                    dataFusion?.drop_columns(rightId, extraRightFields)
                  }

                  rebuildSchema(rightId, target, rightCollection.id, rightCollection.schema, leftCollection.schema.shares, rightFragments, task_meta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
                    execute(rightId, wal, fragments, true, false, dataFusion, metadata, dataSpace, keyStore).then(() => {
                      updateSchema(rightId, rightFragments, renames, dataFusion)

                      writeRemoteTable(rightId, uri, schema, user, arrow, dataFusion, keyStore)

                      resolve({
                        actions: actions,
                        metadata: meta
                      })
                    })
                  })
                }
              })
            })
          }

        // Privatise transformers generate synthesized data based on the schema
        } else if (transformer.type === "privatise") {
          const collection = collections[0]

          if (collection && target) {
            verifySchema(collection.schema, keyStore.get_key(collection.schema.key_id)).then(schemaIsValid => {
              if (!schemaIsValid) {
                reject([ExecutionError.Integrity, "Cannot validate schema integrity"])
                return
              }

              const id = dataFusion?.clone_table(collection.id, transformer_id)
              const cloneId = dataFusion?.clone_table(collection.id, "")

              rebuildSchema(id, target, collection.id, collection.schema, [], fragments, task_meta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
                // Retrieve the epsilon and column budgets
                const { epsilon, weights } = JSON.parse(keyStore.decrypt_metadata(dataSpace.key_id, wal["data"]))

                // Generate the synthesized table
                dataFusion?.synthesize_table(id, cloneId, weights, epsilon).then(() => {
                  dataFusion?.merge_table(id, cloneId)

                  updateSchema(id, fragments, renames, dataFusion)
                  writeRemoteTable(id, task.task["uri"], schema, user, arrow, dataFusion, keyStore).then(() => {
                    resolve({
                      actions: actions,
                      metadata: meta
                    })
                  }).catch(() => {
                    reject([ExecutionError.Failure, "Error saving table"])
                    return
                  })
                })
              })
            })
          }

        } else if (transformer.type === "mpc") {
          const collection = collections[0]

          if (collection && target) {
            verifySchema(collection.schema, keyStore.get_key(collection.schema.key_id)).then(schemaIsValid => {
              if (!schemaIsValid) {
                reject([ExecutionError.Integrity, "Cannot validate schema integrity"])
                return
              }

              const signature = transformer.signatures?.find(x => x.split(":")[0] === user.id)?.split(":")[1] || ""
              const message = transformer_id + Object.values(wal.identifiers).map(x => x.id).join() + wal.transactions.join()

              protocol?.verify(message, signature, undefined).then((isApproved: boolean) => {
                if (!isApproved) {
                  reject([ExecutionError.Integrity, "Transformer unauthorized"])
                  return
                }

                const mpcResult = store.getState().mpc.entities[transformer_id]
                const { selected, groups, output, randoms } = JSON.parse(keyStore.decrypt_metadata(dataSpace.key_id, wal["data"]))

                const ourFragments = fragments.filter(f => selected.indexOf(f) !== -1)

                // Result is in, let's create a collection
                if (mpcResult && mpcResult.nr_parties && mpcResult.partitions && mpcResult.values && mpcResult.values.length > 0) {
                  let randomTotals = mpcResult.partitions.map(_ => BigInt(0))
                  for (let i=0; i < mpcResult.partitions.length; i++) {
                    for (let j=0; j < mpcResult.nr_parties; j++) {
                      randomTotals[i] += BigInt(randoms[i * mpcResult.partitions.length + j])
                    }
                  }

                  const results = mpcResult.values.map((x, i) => (BigInt(x) - randomTotals[i]).toString())

                  const id = dataFusion?.clone_table(collection.id, transformer_id)
                  const query = wal.transactions[0].replace(/SUM\(([[0-9I%$]+)\)/, "0")

                  rebuildSchema(id, target, collection.id, collection.schema, [], [...groups, output], task_meta, user, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
                    dataFusion?.query(id, buildQuery(query, wal, metadata, dataSpace, keyStore)).then(() => {
                      let row = dataFusion?.get_row(id, 0)
                      row[output] = results[0]
                      let rows = [Object.keys(row).join(), Object.values(row).join()]

                      for (let i=1; i < mpcResult.partitions!.length; i++) {
                        let row = dataFusion?.get_row(id, i)
                        row[output] = results[i]
                        rows.push(Object.values(row).join())
                      }
                      const csv = rows.join("\n")

                      dataFusion?.drop_table(id)
                      dataFusion.load_csv(csv, id)

                      updateSchema(id, [...groups, output], renames, dataFusion)

                      writeRemoteTable(id, task.task["uri"], schema, user, arrow, dataFusion, keyStore).then(() => {
                        resolve({
                          actions: actions,
                          metadata: meta
                        })
                      })
                    })
                  })

                // Just compute our share and send it to the server
                } else if (ourFragments.length === 1) {
                  const ourFragment = ourFragments[0]
                  const id = dataFusion?.clone_table(collection.id, transformer_id)
                  const offset = selected.indexOf(ourFragment)

                  dataFusion?.query(id, buildQuery(wal.transactions[offset], wal, metadata, dataSpace, keyStore)).then(() => {
                    computeMPC(id, groups, output, offset, randoms, dataFusion).then(({ values, partitionKeys }) => {
                      const restFragments = fragments.filter(x => selected.indexOf(x) === -1 && output !== x)
                      const completedFragments = [...restFragments, ...[ourFragment]]

                      const shareAction = shareMPCPartial({
                        id: transformer_id,
                        partitions: partitionKeys,
                        values: values
                      })

                      resolve({
                        actions: [shareAction],
                        metadata: {},
                        completed_fragments: completedFragments
                      })
                    })
                  })
                } else {
                  reject([ExecutionError.Retry, "Waiting for data"])
                }
              })
            })
          }

        }
      }).catch((e: string) => {
        reject([ExecutionError.Retry, e])
      })

    // When one or more input collections have been updated, the artifacts in the WAL may no longer be valid. This task will
    // re-run the original transaction and record the new artifacts. The resulting TransformerWALUpdated event will trigger the
    // actual updating (see: compute_fragment).
    } else if (instruction === "update_artifacts") {
      Promise.all(collections.map((collection) => {
        return new Promise<void>((resolve, reject) => {
          if (dataFusion?.table_exists(collection?.id)) {
            resolve()

          } else if (collection?.id && collection?.uri) {
            loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore).then(() => resolve())
          }
        })
      })).then(() => {
        if (transformer.type !== "merge" && transformer.type !== "privatise" && transformer.type !== "mpc") {
          const collection = collections[0]

          if (collection) {
            const id = dataFusion?.clone_table(collection.id, transformer_id)

            if (transformer.type === "aggregate") {
              const arrow_schema = dataFusion?.get_schema(id)
              const fields = arrow_schema.fields.map((field: any) => {
                const fullColumn = collection.schema.columns.find(column => field.name === column.id)
                const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[fullColumn?.concept_id ?? ""])
                const defaultAggregateFn = (maybe_concept && maybe_concept.aggregateFn) || "array_agg"

                return {...field, ...{
                  metadata: {
                    aggregate_fn: defaultAggregateFn
                  }
                }}
              })

              dataFusion?.update_schema(id, {...arrow_schema, ...{fields: fields}})
            }

            execute(id, wal, collection.schema.column_order, false, true, dataFusion, metadata, dataSpace, keyStore).then((artifacts: string[]) => {
              resolve({
                actions: [
                  updateTransformerWAL({
                    id: transformer_id,
                    workspace: transformer.workspace,
                    wal: {...wal, ...{artifacts: artifacts}}
                  })
                ],
                metadata: {}
              })
            })
          }

        } else if (transformer.type === "merge") {
          const leftCollection = collections[0]
          const rightCollection = collections[1]

          // Merge transformers only support one transaction
          const transaction = wal.transactions[0]

          if (leftCollection && rightCollection && transaction) {
            const id = dataFusion?.clone_table(leftCollection.id, transformer_id)

            dataFusion?.join(id, leftCollection.id, rightCollection.id, buildQuery(transaction, wal, metadata, dataSpace, keyStore)).then((artifacts: string[]) => {
              resolve({
                actions: [
                  updateTransformerWAL({
                    id: transformer_id,
                    workspace: transformer.workspace,
                    wal: {...wal, ...{artifacts: [artifacts.join("|")]}}
                  })
                ],
                metadata: {}
              })

            })
          }

        } else if (transformer.type === "privatise") {
          resolve({
            actions: [
              updateTransformerWAL({
                id: transformer_id,
                workspace: transformer.workspace,
                wal: wal
              })
            ],
            metadata: {}
          })

        }
      })
    }

  })
}


const updateSchema = (id: string, fragments: string[], renames: {[key: string]: string}, dataFusion: any) => {
  // Limit the schema to just the fragments
  const arrow_schema = dataFusion?.get_schema(id)
  const fields = arrow_schema.fields.filter((field: any) => fragments.indexOf(field.name) !== -1)

  // Maybe update the arrow schema with the new field names
  if (Object.keys(renames).length > 0) {
    const new_fields = fields.map((field: any) => {
      if (field.name in renames) {
        let new_field = JSON.parse(JSON.stringify(field))
        new_field.name = renames[field.name]
        return new_field
      }
      return field
    })
    dataFusion?.update_schema(id, {...arrow_schema, ...{fields: new_fields}})
  } else {
    dataFusion?.update_schema(id, {...arrow_schema, ...{fields: fields}})
  }
}


const computeMPC = async (id: string, groups: string[], output: string, offset: number, randoms: string[], dataFusion: any) => {
  let values = []
  let partitionKeys = []

  const nrRows = dataFusion?.nr_rows(id)

  for (let i = 0; i < nrRows; i++) {
    const randomValue = BigInt(randoms[nrRows * i + offset])

    // TODO: Use concept to determine best way to deal with cutoffs (e.g. decimals)
    const row = dataFusion?.get_row(id, i)
    const result = row[output]
    const realValue = BigInt(Math.floor(result))

    values.push((randomValue + realValue).toString())

    if (groups.length > 0) {
      let groupValue = groups.map(x => row[x].toString()).join()
      const encoder = new TextEncoder()
      const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(groupValue))

      partitionKeys.push(toHex(new Uint8Array(bytes)))
    }
  }

  return {
    values: values,
    partitionKeys: partitionKeys.length === 0 ? ["NONE"] : partitionKeys
  }
}


const execute = async (id: string, wal: WAL, fragments: string[], useArtifacts: boolean, isLeft: boolean, dataFusion: any, metadata: any, dataSpace: DataSpace | undefined, keyStore: any) => {
  // Collect any query artifacts. Caller may optionally use these when updating artifacts.
  let artifacts: string[] = []

  // Check if a new column will be added
  const newColumns = Object.entries(wal.identifiers)
    .filter(([i, identifier]) => identifier.type === "column" && identifier.action === "add")
    .map(([i, _]) => i)

  if (useArtifacts) {
    for (const artifact of wal.artifacts) {
      let splitArtifact = artifact.split("|")

      await dataFusion?.apply_artifact(id, isLeft ? splitArtifact[0] : splitArtifact[1])
    }

  } else {
    for (let i = 0; i < wal.transactions.length; i++) {
      const transaction = wal.transactions[i]
      let cloneId = dataFusion?.clone_table(id, "")

      // Run the query
      const artifact = await dataFusion?.query(id, buildQuery(transaction, wal, metadata, dataSpace, keyStore))

      // Check if this transaction will add a new column
      if (newColumns.length > 0) {
        if (newColumns.filter(i => transaction.indexOf(`%${i}$I`) !== -1).length > 0) {

          // A transaction with a new column will require the result to be appended
          dataFusion?.append_table(id, cloneId)
          cloneId = dataFusion?.clone_table(id, "")
        }
      }

      const resultSchema = dataFusion?.get_schema(id)
      const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

      // Verify that the query returned all the fragments
      if (fragments.filter(fragment => resultColumns.indexOf(fragment) === -1).length === 0) {
        dataFusion?.drop_table(cloneId)

      // If not, apply the artifact regardless and merge the results.
      } else {
        await dataFusion?.apply_artifact(cloneId, artifact)
        dataFusion?.merge_table(cloneId, id)
        dataFusion?.move_table(cloneId, id)
      }

      artifacts.push(artifact)
    }
  }

  return artifacts
}


const rebuildSchema = async (id: string, target: Collection, oldId: string, old: Schema, extraShares: Share[], fragments: string[], taskMeta: {[key: string]: any}, user: User, metadata: any, dataSpace: DataSpace | undefined, keyStore: any, protocol: any) => {
  let schema: Schema
  let rotateSchema: Schema | undefined
  let actions: any[] = []
  let meta = JSON.parse(JSON.stringify(taskMeta))
  let updated = false

  if ("rotate_schema" in taskMeta) {
    rotateSchema = meta["rotate_schema"]

    if (rotateSchema) {
      const schemaIsValid = await verifySchema(rotateSchema, keyStore?.get_key(rotateSchema.key_id))
      if (!schemaIsValid) {
        throw new Error("Invalid schema signature")
      }
    }
  }

  if ("schema" in taskMeta) {
    schema = meta["schema"]

    const schemaIsValid = await verifySchema(schema, keyStore?.get_key(schema.key_id))
    if (!schemaIsValid) {
      throw new Error("Invalid schema signature")
    }

  } else {
    const key_id = await keyStore?.generate_key(16)

    // If the rotate schema is present, this collection already exists but is being refreshed. The old
    // schema is used to get the shares of the collection, so that they aren't reset on update.
    if (rotateSchema) {
      for (const share of rotateSchema.shares) {
        if (share.principal && share.principal !== user.id) {
          const receiver = share.principal
          const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

          actions.push(shareSecret({
            key_id: key_id,
            owner: user.id,
            receiver: receiver,
            ciphertext: ciphertext
          }))
        }
      }

      schema = {
        id: target.id,
        key_id: key_id,
        column_order: [],
        columns: [],
        shares: JSON.parse(JSON.stringify(rotateSchema.shares)),
        tag: ''
      }

    } else {
      // Merge the optional extra shares from other schemas
      let shares: Share[] = JSON.parse(JSON.stringify(old.shares))
      for (const share of extraShares) {
        if (!shares.find(s => s.principal === share.principal)) {
          shares.push(share)
        }
      }

      // Re-share the schema key with everyone
      for (const share of shares) {
        if (share.principal && share.principal !== user.id) {
          const receiver = share.principal
          const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

          actions.push(shareSecret({
            key_id: key_id,
            owner: user.id,
            receiver: receiver,
            ciphertext: ciphertext
          }))
        }
      }

      schema = {
        id: target.id,
        key_id: key_id,
        column_order: [],
        columns: [],
        shares: shares,
        tag: ''
      }

      // Re-publish the title under the new id
      const maybe_title = metadata[oldId]
      if (maybe_title && !(target.id in metadata)) {
        const title = keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_title)

        actions.push(createMetadata({
          id: target.id,
          workspace: target.workspace,
          metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, title)
        }))
      }
    }

    updated = true
  }

  // This transformer task may not be the first, so the fragment could already exist in the schema. Each column
  // keeps track of it's lineage, which can now be used to filter the columns that have already been created so far.
  const new_fragments = fragments.filter(f => !schema.columns.find(col => col.lineage === f))

  // Filter the old columns with the fragments that are left
  const old_columns = old.columns.filter(c => new_fragments.indexOf(c.id) !== -1)

  let columns = []

  for (const column of old_columns) {
    const rotateColumn = rotateSchema?.columns.find(c => c.lineage === column.id)

    const id = rotateColumn ? rotateColumn.id : crypto.randomUUID()
    const key_id = await keyStore?.generate_key(16)

    // Re-share the column key
    for (const share of rotateColumn?.shares || column.shares) {
      if (share.principal && share.principal !== user.id) {
        const receiver = share.principal
        const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

        actions.push(shareSecret({
          key_id: key_id,
          owner: user.id,
          receiver: receiver,
          ciphertext: ciphertext
        }))
      }
    }

    columns.push({...(rotateColumn || column), ...{
      id: id,
      key_id: key_id,
      lineage: column.id
    }})

    updated = true
  }

  if (updated) {
    schema.column_order = [...schema.column_order, ...columns.map(x => x.id)]
    schema.columns = [...schema.columns, ...columns]

    const schemaClone = JSON.parse(JSON.stringify(schema))
    const signedSchema = await signSchema(schemaClone, keyStore?.get_key(schema.key_id))

    actions.push(updateCollectionSchema({
      id: target.id,
      workspace: target.workspace,
      schema: signedSchema
    }))

    meta["schema"] = signedSchema
  }

  // After updating the real schema, return a limited one that
  // only includes the fragment columns.
  const miniSchema: Schema = JSON.parse(JSON.stringify(schema))
  miniSchema.columns = miniSchema.columns.filter(col => fragments.indexOf(col.lineage || "") !== -1)
  miniSchema.column_order = miniSchema.columns.map(x => x.id)

  let renames: {[key: string]: string} = {}
  for (const column of schema.columns) {
    const old_column = old.columns.find(c => c.id === column.lineage)

    if (old_column) {
      renames[old_column.id] = column.id
    }
  }

  return {
    actions: actions,
    schema: miniSchema,
    renames: renames,
    meta: meta
  }
}
