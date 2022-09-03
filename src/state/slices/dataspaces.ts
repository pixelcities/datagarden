import { createSelector, createSlice, createEntityAdapter } from '@reduxjs/toolkit'
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

// selectors
export const {
  selectAll: selectDataSpaces
} = dataSpacesAdapter.getSelectors<RootState>(state => state.dataspaces)

export const selectActiveDataSpace = createSelector(
  selectDataSpaces,
  dataSpaces => dataSpaces[0]
)

