import { WAL, DataSpace } from 'types'

export const buildQuery = (query: string, log: WAL, metadata: any, dataSpace: DataSpace | undefined, keyStore: any) => {
  let q = query

  Object.entries(log.identifiers).forEach(([i, id]) => {
    q = q.replace(new RegExp(`(?:%(${i})\\$I)`, "g"), `"${id}"`)
  })

  Object.entries(log.values).forEach(([i, v]) => {
    const maybe = metadata[v]

    if (maybe) {
      const dvalue = keyStore?.decrypt_metadata(dataSpace?.key_id, maybe)

      q = q.replace(new RegExp(`(?<!\\$)\\$(?!\\$)(${i})`, "g"), `${dvalue}`)

    } else {
      console.log(`Cannot decrypt value ${i} to construct query`)
    }
  })

  return q
}

