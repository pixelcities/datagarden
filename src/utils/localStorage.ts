import { keyStoreRef } from 'contexts/keystore/KeyStoreContext'
import { DataSpace } from 'types'


const saveState = (id: number, state: any) => {
  // Extract active dataspace
  const dataspaces: DataSpace[] = Object.values(state.dataspaces.entities)
  const ds = dataspaces[0]

  // Filter ephemeral slices
  const filteredState = Object.keys(state)
    .filter(k => k !== "dataspaces" && k !== "secrets" && k!== "tasks")
    .reduce((obj, k) => {
      return {...obj, [k]: state[k]}
    }, {})

  // Save the state to localStorage, but encrypt it with the metadata key to
  // ensure no data lingers around unexpectedly.
  //
  // TODO: Use a user specific secret, not the metadata key
  if (keyStoreRef) {
    localStorage.setItem(ds.handle, keyStoreRef.encrypt_metadata(ds.key_id, JSON.stringify({
      id: id,
      state: filteredState
    })))
  }
}

const getState = (handle: string, keyId: string) => {
  const maybeCache = localStorage.getItem(handle)

  if (maybeCache && keyStoreRef) {
    const cache = JSON.parse(keyStoreRef.decrypt_metadata(keyId, maybeCache))

    return {
      id: cache.id,
      state: cache.state
    }
  }

  // Always return an event id
  return {
    id: 0,
    state: null
  }
}

const resetState = (handle: string) => {
  localStorage.removeItem(handle)
}

export {
  saveState,
  getState,
  resetState
}
