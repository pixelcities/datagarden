import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { DataURI } from 'types'

const dataURIAdapter = createEntityAdapter<DataURI>()
const initialState = dataURIAdapter.getInitialState()

// reducers
const dataURISlice = createSlice({
  name: 'dataURI',
  initialState: initialState,
  reducers: {
    dataURICreated: dataURIAdapter.upsertOne
  }
})

export default dataURISlice.reducer


// actions
export const {
  dataURICreated
} = dataURISlice.actions


// selectors
export const {
  selectById: selectDataURIById,
} = dataURIAdapter.getSelectors<RootState>(state => state.uris)

