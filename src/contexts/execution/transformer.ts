import { EnhancedStore } from '@reduxjs/toolkit'

import { ExecutionError, User, DataSpace, Task, Collection, Schema, Share, WAL } from 'types'
import { RootState } from 'state/store'
import { shareSecret, createMetadata, updateCollectionSchema } from 'state/actions'

import { writeRemoteTable } from 'utils/writeRemoteTable'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { buildQuery } from 'utils/buildQuery'

export const handleTask = (task: Task, user: User, dataSpace: DataSpace, store: EnhancedStore<RootState>, keyStore: any, protocol: any, arrow: any, dataFusion: any) => {
  return new Promise<{actions: any[], metadata: {[key: string]: any}}>((resolve, reject) => {
    const instruction = task.task["instruction"]
    const transformer_id = task.task["transformer_id"]
    const target_id = task.task["collection_id"]
    const wal = task.task["wal"]
    const fragments = task.fragments
    const task_meta = task.metadata

    if (instruction === "compute_fragment") {
      const target = store.getState().collections.entities[target_id]
      const transformer = store.getState().transformers.entities[transformer_id]
      const collections = transformer?.collections.map(id => store.getState().collections.entities[id]) ?? []
      const metadata = Object.values(store.getState().metadata.entities).reduce((a, b) => ({...a, [b?.id ?? ""]: b?.metadata}), {})
      const users = Object.values(store.getState().users.entities).reduce((a, b) => ({...a, [b?.email ?? ""]: b?.id}), {})

      if (!transformer) {
        reject(ExecutionError.Retry)
        return
      }

      console.log("Received a transformer task: ", task.task)

      // Load all the input collections in memory
      Promise.all(collections.map((collection) => {
        return new Promise<void>((resolve, reject) => {
          if (dataFusion?.table_exists(collection?.id)) {
            resolve()

          } else if (collection?.id && collection?.uri) {
            loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore, fragments).then(() => resolve())
          }
        })
      })).then(() => {

        // Handle transformer tasks with just one input collection
        if (transformer.type !== "merge") {
          const collection = collections[0]

          if (collection && target) {
            // Create a copy, in case the user was looking at this collection
            const id = dataFusion?.clone_table(collection.id, transformer_id)

            // Build a new schema, including new keys
            rebuildSchema(id, target, collection.id, collection.schema, [], fragments, task_meta, user, users, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {

              // Look at the requested fragments, and determine if this requires executing the
              // real query or if we can simply use the artifact.
              const identifiers = Object.values(wal.identifiers)
              const nrFragments = fragments.filter(f => identifiers.indexOf(f) !== -1)
              const useArtifacts = nrFragments.length === 0

              execute(id, wal, fragments, useArtifacts, true, dataFusion, metadata, dataSpace, keyStore).then(() => {
                const uri = task.task["uri"]

                // Update the schema to reflect the new columns, and drop the old
                updateSchema(id, fragments, renames, dataFusion)

                // And finally, save the table to s3
                writeRemoteTable(id, uri, schema, user, arrow, dataFusion, keyStore)

                resolve({
                  actions: actions,
                  metadata: meta
                })
              })
            })
          }

        // Handle merge transformers by simply creating up to two tables
        } else {
          const uri = task.task["uri"]
          const leftCollection = collections[0]
          const rightCollection = collections[1]

          if (leftCollection && rightCollection && target) {
            // Split the fragments in left and right
            const leftFragments = fragments.filter(f => leftCollection.schema.column_order.indexOf(f) !== -1)
            const rightFragments = fragments.filter(f => rightCollection.schema.column_order.indexOf(f) !== -1)

            // Apply the left artifacts, this possibly also handles the case where both have fragments
            if (leftFragments.length > 0) {
              const leftId = dataFusion?.clone_table(leftCollection.id, "")

              rebuildSchema(leftId, target, leftCollection.id, leftCollection.schema, rightCollection.schema.shares, leftFragments, task_meta, user, users, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
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
                      const leftActions = actions
                      const leftMeta = meta

                      rebuildSchema(rightId, target, rightCollection.id, rightCollection.schema, leftCollection.schema.shares, rightFragments, leftMeta, user, users, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
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

              rebuildSchema(rightId, target, rightCollection.id, rightCollection.schema, leftCollection.schema.shares, rightFragments, task_meta, user, users, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames, meta}) => {
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

          }
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


const execute = async (id: string, wal: WAL, fragments: string[], useArtifacts: boolean, isLeft: boolean, dataFusion: any, metadata: any, dataSpace: DataSpace | undefined, keyStore: any) => {
  if (useArtifacts) {
    for (const artifact of wal.artifacts) {
      let splitArtifact = artifact.split("|")

      await dataFusion?.apply_artifact(id, isLeft ? splitArtifact[0] : splitArtifact[1])
    }

  } else {
    for (let i = 0; i < wal.transactions.length; i++) {
      const transaction = wal.transactions[i]
      const cloneId = dataFusion?.clone_table(id, "")

      await dataFusion?.query(id, buildQuery(transaction, wal, metadata, dataSpace, keyStore))
      const resultSchema = dataFusion?.get_schema(id)
      const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

      // Verify that the query returned all the fragments
      if (fragments.filter(fragment => resultColumns.indexOf(fragment) === -1).length === 0) {
        dataFusion?.drop_table(cloneId)

      // If not, apply the artifact regardless and merge the results.
      } else {
        await dataFusion?.apply_artifact(cloneId, wal.artifacts[i])
        dataFusion?.merge_table(cloneId, id)
        dataFusion?.move_table(cloneId, id)
      }
    }
  }
}


const rebuildSchema = async (id: string, target: Collection, oldId: string, old: Schema, extraShares: Share[], fragments: string[], taskMeta: {[key: string]: any}, user: User, users: any, metadata: any, dataSpace: DataSpace | undefined, keyStore: any, protocol: any) => {
  let schema: Schema
  let actions: any[] = []
  let meta = JSON.parse(JSON.stringify(taskMeta))
  let updated = false

  if ("schema" in taskMeta) {
    schema = meta["schema"]

  } else {
    const key_id = await keyStore?.generate_key(16)

    // Merge the optional extra shares from other schemas
    let shares: Share[] = JSON.parse(JSON.stringify(old.shares))
    for (const share of extraShares) {
      if (!shares.find(s => s.principal === share.principal)) {
        shares.push(share)
      }
    }

    // Re-share the schema key with everyone
    for (const share of shares) {
      if (share.principal && share.principal !== user.email) {
        const receiver = users[share.principal]
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
      shares: shares
    }

    // Re-publish the title under the new id
    const maybe_title = metadata[oldId]
    if (maybe_title) {
      const title = keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_title)

      actions.push(createMetadata({
        id: target.id,
        workspace: target.workspace,
        metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, title)
      }))
    }

    updated = true
  }

  // This transformer task may not be the first, so the fragment could already exist in the schema. Start
  // with finding the linked concept of the fragments because the fragment (column) id itself will have changed.
  const concepts = fragments.map(f => old.columns.find(c => c.id === f)?.concept_id)

  // Filter out the concepts that are already present in the schema
  const new_concepts = concepts.filter(conceptId => !schema.columns.find(col => col.concept_id === conceptId))

  // And finally filter the old columns with the concept ids that are left
  const old_columns = old.columns.filter(c => new_concepts.indexOf(c.concept_id) !== -1)

  let columns = []
  let renames: {[key: string]: string} = {}

  for (const column of old_columns) {
    const id = crypto.randomUUID()
    const key_id = await keyStore?.generate_key(16)

    // Re-share the column key
    for (const share of column.shares) {
      if (share.principal && share.principal !== user.email) {
        const receiver = users[share.principal]
        const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

        actions.push(shareSecret({
          key_id: key_id,
          owner: user.id,
          receiver: receiver,
          ciphertext: ciphertext
        }))
      }
    }

    columns.push({...column, ...{
      id: id,
      key_id: key_id
    }})

    // Re-publish the column name
    const maybe = metadata[column.id]
    if (maybe) {
      const header = keyStore?.decrypt_metadata(dataSpace?.key_id, maybe)

      actions.push(createMetadata({
        id: id,
        workspace: target.workspace,
        metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, header)
      }))
    }

    renames[column.id] = id
    updated = true
  }

  if (updated) {
    schema.column_order = [...schema.column_order, ...columns.map(x => x.id)]
    schema.columns = [...schema.columns, ...columns]

    const schemaClone = JSON.parse(JSON.stringify(schema))
    actions.push(updateCollectionSchema({
      id: target.id,
      workspace: target.workspace,
      schema: schemaClone
    }))

    meta["schema"] = schemaClone
  }

  // After updating the real schema, return a limited one that
  // only includes the fragment columns.
  schema.column_order = columns.map(x => x.id)
  schema.columns = columns

  return {
    actions: actions,
    schema: schema,
    renames: renames,
    meta: meta
  }
}
