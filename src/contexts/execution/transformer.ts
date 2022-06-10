import { EnhancedStore } from '@reduxjs/toolkit'

import { User } from 'types'
import { Task } from 'types'
import { RootState } from 'state/store'

import { writeRemoteTable } from 'utils/writeRemoteTable'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { buildQuery } from 'utils/buildQuery'

export const handleTask = (task: Task, user: User, metadata: any, store: EnhancedStore<RootState>, keyStore: any, arrow: any, dataFusion: any, onComplete: () => void) => {
  const instruction = task.task["instruction"] || "compute_fragment"
  const transformer_id = task.task["transformer_id"] || task.task.identifiers[1]
  const wal = task.task

  if (instruction === "compute_fragment") {
    const dataSpace = Object.values(store.getState().dataspaces.entities)[0]
    const transformer = store.getState().transformers.entities[transformer_id]
    const collections = transformer?.collections.map(id => store.getState().collections.entities[id]) ?? []

    if (transformer) {
      console.log("Received a transformer task: ", task.task)

      Promise.all(collections.map((collection) => {
        return new Promise<void>((resolve, reject) => {
          if (dataFusion?.table_exists(collection?.id)) {
            resolve()

          } else if (collection?.id && collection?.uri) {
            loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore, resolve)
          }
        })
      })).then(() => {
        if (transformer.type !== "merge") {
          const collection = collections[0]

          if (collection) {
            const id = dataFusion?.clone_table(collection.id, transformer_id)

            // TODO: Check whether to use query or artifact
            Promise.all(wal.transactions.map((transaction: string) => {
              return new Promise<void>((resolve, reject) => {
                dataFusion?.query(id, buildQuery(transaction, wal, metadata, dataSpace, keyStore)).then(() => resolve())
              })
            })).then(() => {
              const uri = store.getState().uris.entities[id]?.uri ?? ""

              writeRemoteTable(id, uri, collection.schema, user, arrow, dataFusion, keyStore)

              onComplete()
            })
          }
        }
      })
    }
  }
}

