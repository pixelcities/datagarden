import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Secret } from 'types'

const secretsAdapter = createEntityAdapter<Secret>({
  selectId: (secret) => secret.key_id
})
const initialState = secretsAdapter.getInitialState()

// reducers
const secretsSlice = createSlice({
  name: 'secrets',
  initialState: initialState,
  reducers: {
    secretShared: secretsAdapter.addOne,
    deleteLocalSecret: secretsAdapter.removeOne,
  }
})

export default secretsSlice.reducer


// actions
export const {
  secretShared,
  deleteLocalSecret
} = secretsSlice.actions


// selectors
export const {
  selectAll: selectSecrets
} = secretsAdapter.getSelectors<RootState>(state => state.secrets)

