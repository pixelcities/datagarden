import { createSelector, createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Metadata } from 'types'

const metadataAdapter = createEntityAdapter<Metadata>()
const initialState = metadataAdapter.getInitialState()

// reducers
const metadataSlice = createSlice({
  name: 'metadata',
  initialState: initialState,
  reducers: {
    metadataCreated: metadataAdapter.addOne,
    metadataUpdated: metadataAdapter.upsertOne
  }
})

export default metadataSlice.reducer


// actions
export const {
  metadataCreated,
  metadataUpdated
} = metadataSlice.actions


// selectors
export const {
  selectAll: selectMetadata,
  selectById: selectMetadataById,
} = metadataAdapter.getSelectors<RootState>(state => state.metadata)

export const selectMetadataMap = createSelector(
  selectMetadata,
  metadata => metadata.reduce((acc: {[key: string]: string}, data) => ({...acc, [data.id]: data.metadata}), {})
)

