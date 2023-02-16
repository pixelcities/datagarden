import { WAL, DataSpace, Identifier } from 'types'

export const buildQuery = (query: string, log: WAL, metadata: any, dataSpace: DataSpace | undefined, keyStore: any) => {
  let q = query

  Object.entries(log.identifiers).forEach(([i, id]) => {
    q = q.replace(new RegExp(`(?:%(${i})\\$I)`, "g"), `"${id.id}"`)
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

export const getIdentifiers = (currentIdentifiers: {[key: string]: Identifier}, tableIds: string[], columnIds: string[]) => {
  let identifiers: {[key: string]: Identifier} = JSON.parse(JSON.stringify(currentIdentifiers))

  // Get the next id, starting at 1
  let nextId = Object.keys(identifiers).length ? Math.max(...Object.keys(identifiers).map(Number)) + 1 : 1

  // Check if the identifiers need to be added to the log
  const missingTableIdentifiers = tableIds.filter(i => !Object.values(identifiers).find(id => id.id === i))
  const missingColumnIdentifiers = columnIds.filter(i => !Object.values(identifiers).find(id => id.id === i))

  // Add the missing identifiers
  for (const tableId of missingTableIdentifiers) {
    identifiers[nextId++] = {"id": tableId, "type": "table"}
  }

  for (const columnId of missingColumnIdentifiers) {
    identifiers[nextId++] = {"id": columnId, "type": "column"}
  }

  // Invert the map for easy access
  let ids: {[key: string]: string} = {}
  Object.entries(identifiers).forEach(([i, id]) => ids[id.id] = i)

  return {
    "identifiers": identifiers,
    "ids": ids
  }
}
