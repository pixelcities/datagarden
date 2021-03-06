import { createSelector, createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Source, User, Share } from 'types'

const sourcesAdapter = createEntityAdapter<Source>()
const initialState = sourcesAdapter.getInitialState()


// reducers
const sourcesSlice = createSlice({
  name: 'sources',
  initialState: initialState,
  reducers: {
    sourceCreated: sourcesAdapter.addOne,
    sourceUpdated: sourcesAdapter.upsertOne
  }
})

export default sourcesSlice.reducer


// actions
export const {
  sourceCreated,
  sourceUpdated
} = sourcesSlice.actions



// selectors
export const {
  selectAll: selectSources,
  selectById: selectSourceById
} = sourcesAdapter.getSelectors<RootState>(state => state.sources)

export const selectVisibleSources = createSelector(
  selectSources,
  (_: RootState, user: User | undefined) => user,
  (sources, user) => sources.filter(source => !!source.schema.shares.find((share: Share) => (share.principal === user?.email) || (share.type === "internal") ))
)

export const selectUsableSources = createSelector(
  selectVisibleSources,
  sources => sources.filter(source => source.is_published)
)

