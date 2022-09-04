import { createSelector, createSlice, createEntityAdapter, createAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { DataSpace } from 'types'

const dataSpacesAdapter = createEntityAdapter<DataSpace>()
const initialState = dataSpacesAdapter.getInitialState()

// reducers
const dataSpacesSlice = createSlice({
  name: 'dataspaces',
  initialState: initialState,
  reducers: {
    setActiveDataSpace: dataSpacesAdapter.addOne,
    leaveDataSpace: dataSpacesAdapter.removeAll,
  }
})

export default dataSpacesSlice.reducer


// actions
export const {
  setActiveDataSpace,
  leaveDataSpace
} = dataSpacesSlice.actions

// A special internal action that is only used to quickly restore state
// when cached local storage is present.
//
// See also: state/store.ts
export const loadDataSpace = createAction<any>('dataspaces/loadDataSpace')

// selectors
export const {
  selectAll: selectDataSpaces
} = dataSpacesAdapter.getSelectors<RootState>(state => state.dataspaces)

export const selectActiveDataSpace = createSelector(
  selectDataSpaces,
  dataSpaces => dataSpaces[0]
)

