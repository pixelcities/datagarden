import { EnhancedStore } from '@reduxjs/toolkit'

import { ExecutionError, User, DataSpace, Task, Collection, Schema } from 'types'
import { RootState } from 'state/store'
import { shareSecret, createMetadata, updateCollectionSchema } from 'state/actions'

import { writeRemoteTable } from 'utils/writeRemoteTable'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { buildQuery } from 'utils/buildQuery'

export const handleTask = (task: Task, user: User, dataSpace: DataSpace, store: EnhancedStore<RootState>, keyStore: any, protocol: any, arrow: any, dataFusion: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const instruction = task.task["instruction"] || "compute_fragment"
    const transformer_id = task.task["transformer_id"] || task.task.identifiers[1]
    const target_id = task.task["collection_id"]
    const wal = task.task["wal"]
    const fragments = task.fragments

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
            rebuildSchema(id, target, collection.id, collection.schema, fragments, user, users, metadata, dataSpace, keyStore, protocol).then(({actions, schema, renames}) => {

              // Look at the requested fragments, and determine if this requires executing the
              // real query or if we can simply use the artifact.
              const identifiers = Object.values(wal.identifiers)
              const nrFragments = fragments.filter(f => identifiers.indexOf(f) !== -1)

              Promise.all((() => {
                // None of the fragments are in the query, so the artifact can be used.
                if (nrFragments.length === 0) {
                  return wal.artifacts.map((artifact: string) => {
                    return new Promise<void>((resolve, reject) => {
                      dataFusion?.apply_artifact(id, artifact).then(() => resolve())
                    })
                  })

                // At least one of the fragments is part of the query statement, so the full query
                // needs to be executed.
                } else {
                  return wal.transactions.map((transaction: string) => {
                    return new Promise<void>((resolve, reject) => {
                      dataFusion?.query(id, buildQuery(transaction, wal, metadata, dataSpace, keyStore)).then(() => resolve())
                    })
                  })
                }

              })()).then(() => {
                const uri = task.task["uri"]

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

                // And finally, save the table to s3
                writeRemoteTable(id, uri, schema, user, arrow, dataFusion, keyStore)

                resolve(actions)
              })
            })
          }
        }
      })
    }

  })
}

const rebuildSchema = async (id: string, target: Collection, oldId: string, old: Schema, fragments: string[], user: User, users: any, metadata: any, dataSpace: DataSpace | undefined, keyStore: any, protocol: any) => {
  let schema: Schema
  let actions: any[] = []
  let updated = false

  if (!!target.schema) {
    schema = JSON.parse(JSON.stringify(target.schema))

  } else {
    const key_id = await keyStore?.generate_key(16)

    // Re-share the schema key with everyone
    for (const share of old.shares) {
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
      shares: old.shares
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

  // This transformer task may not be the first, so the fragment could already exist in the schema
  const new_fragments = fragments.filter(f => schema.column_order.indexOf(f) === -1) // TODO: fix bug
  const old_columns = old.columns.filter(c => new_fragments.indexOf(c.id) !== -1)

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

    actions.push(updateCollectionSchema({
      id: target.id,
      workspace: target.workspace,
      schema: schema
    }))
  }

  // After updating the real schema, return a limited one that
  // only includes the fragment columns.
  schema.column_order = columns.map(x => x.id)
  schema.columns = columns

  return {
    actions: actions,
    schema: schema,
    renames: renames
  }
}
