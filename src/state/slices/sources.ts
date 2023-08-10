import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
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
    sourceUpdated: sourcesAdapter.upsertOne,
    sourceDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    },
    sourceURIUpdated(state, action: PayloadAction<{id: string, workspace: string, uri: [string, string]}>) {
      const source = state.entities[action.payload.id]
      if (source) {
        source.uri = action.payload.uri
      }
    }
  }
})

export default sourcesSlice.reducer


// actions
export const {
  sourceCreated,
  sourceUpdated,
  sourceDeleted,
  sourceURIUpdated
} = sourcesSlice.actions


// selectors
export const {
  selectAll: selectSources,
  selectById: selectSourceById
} = sourcesAdapter.getSelectors<RootState>(state => state.sources)

export const selectVisibleSources = createSelector(
  selectSources,
  (_: RootState, user: User | undefined) => user,
  (sources, user) => sources.filter(source => !!source.schema.shares.find((share: Share) => (share.principal === user?.id) || (share.type === "internal") ))
)

export const selectUsableSources = createSelector(
  selectVisibleSources,
  sources => sources.filter(source => source.is_published)
)

export const selectSourceConceptIdMap = createSelector(
  selectSources,
  sources => sources
    .flatMap(source => source.schema.columns)
    .reduce((acc: {[key: string]: string}, data) => ({...acc, [data.id]: data.concept_id}), {})
)

