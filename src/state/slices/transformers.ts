import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Transformer, WAL } from 'types'

const transformersAdapter = createEntityAdapter<Transformer>()


// reducers
const transformersSlice = createSlice({
  name: 'transformers',
  initialState: transformersAdapter.getInitialState(),
  reducers: {
    transformerCreated: transformersAdapter.addOne,
    transformerUpdated: transformersAdapter.upsertOne,
    transformerPositionSet(state, action: PayloadAction<{id: string, workspace: string, position: number[]}>) {
      const transformer = state.entities[action.payload.id]
      if (transformer) {
        transformer.position = action.payload.position
      }
    },
    transformerTargetAdded(state, action: PayloadAction<{id: string, workspace: string, target: string}>) {
      const transformer = state.entities[action.payload.id]
      const exists = transformer?.targets.includes(action.payload.target)
      if (transformer && !exists) {
        transformer.targets.push(action.payload.target)
      }
    },
    transformerInputAdded(state, action: PayloadAction<{id: string, workspace: string, collection: string, transformer: string}>) {
      const transformer = state.entities[action.payload.id]

      if (transformer && action.payload.collection) {
        transformer.collections.push(action.payload.collection)
      } else if (transformer && action.payload.transformer) {
        transformer.transformers.push(action.payload.transformer)
      }
    },
    transformerWALUpdated(state, action: PayloadAction<{id: string, workspace: string, wal: WAL}>) {
      const transformer = state.entities[action.payload.id]

      if (transformer) {
        transformer.wal = action.payload.wal
      }
    },
    transformerDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default transformersSlice.reducer


// actions
export const {
  transformerCreated,
  transformerUpdated,
  transformerPositionSet,
  transformerTargetAdded,
  transformerInputAdded,
  transformerWALUpdated,
  transformerDeleted
} = transformersSlice.actions


// selectors
export const {
  selectAll: selectTransformers,
  selectById: selectTransformerById
} = transformersAdapter.getSelectors<RootState>(state => state.transformers)

export const selectTransformerIds = createSelector(
  selectTransformers,
  transformers => transformers.map(transformer => transformer.id)
)

