import { createSelector, createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Concept } from 'types'

const conceptsAdapter = createEntityAdapter<Concept>()
const initialState = conceptsAdapter.getInitialState()

// reducers
const conceptsSlice = createSlice({
  name: 'concepts',
  initialState: initialState,
  reducers: {
    conceptCreated: conceptsAdapter.addOne,
    conceptUpdated: conceptsAdapter.upsertOne
  }
})

export default conceptsSlice.reducer


// actions
export const {
  conceptCreated,
  conceptUpdated
} = conceptsSlice.actions


// selectors
export const {
  selectAll: selectConcepts,
  selectById: selectConceptById,
} = conceptsAdapter.getSelectors<RootState>(state => state.concepts)

export const selectConceptMap = createSelector(
  selectConcepts,
  concept => concept.reduce((acc: {[key: string]: Concept}, data) => ({...acc, [data.id]: data}), {})
)

