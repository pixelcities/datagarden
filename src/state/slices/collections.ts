import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Collection, Schema } from 'types'

const collectionsAdapter = createEntityAdapter<Collection>()

const initialState = collectionsAdapter.getInitialState()

// reducers
const collectionsSlice = createSlice({
  name: 'collections',
  initialState: initialState,
  reducers: {
    collectionCreated: collectionsAdapter.addOne,
    collectionUpdated: collectionsAdapter.upsertOne,
    collectionSchemaUpdated(state, action: PayloadAction<{id: string, workspace: string, schema: Schema}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.schema = action.payload.schema
      }
    },
    collectionPositionSet(state, action: PayloadAction<{id: string, workspace: string, position: number[]}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.position = action.payload.position
      }
    },
    collectionIsReadySet(state, action: PayloadAction<{id: string, workspace: string, is_ready: boolean}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.is_ready = action.payload.is_ready
      }
    },
    collectionTargetAdded(state, action: PayloadAction<{id: string, workspace: string, target: string}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.targets.push(action.payload.target)
      }
    },
    collectionTargetRemoved(state, action: PayloadAction<{id: string, workspace: string, target: string}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        const targets = collection.targets.filter(t => t !== action.payload.target)

        collection.targets = targets
      }
    },
    collectionDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default collectionsSlice.reducer


// actions
export const {
  collectionCreated,
  collectionUpdated,
  collectionSchemaUpdated,
  collectionPositionSet,
  collectionIsReadySet,
  collectionTargetAdded,
  collectionTargetRemoved,
  collectionDeleted
} = collectionsSlice.actions


// selectors
export const {
  selectAll: selectCollections,
  selectById: selectCollectionById
} = collectionsAdapter.getSelectors<RootState>(state => state.collections)

export const selectCollectionsByIds = createSelector(
  selectCollections,
  (_: RootState, ids: string[]) => ids,
  (collections, ids): Collection[] => collections.filter(collection => ids.indexOf(collection.id) !== -1)
)

export const selectCollectionIds = createSelector(
  selectCollections,
  collections => collections.map(collection => collection.id)
)

export const selectCollectionConceptIdMap = createSelector(
  selectCollections,
  collections => collections
    .flatMap(collection => collection.schema?.columns ?? [])
    .reduce((acc: {[key: string]: string}, data) => ({...acc, [data.id]: data.concept_id}), {})
)

