import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Collection } from 'types'

const collectionsAdapter = createEntityAdapter<Collection>()

const initialState = collectionsAdapter.getInitialState()

// reducers
const collectionsSlice = createSlice({
  name: 'collections',
  initialState: initialState,
  reducers: {
    collectionCreated: collectionsAdapter.addOne,
    collectionUpdated: collectionsAdapter.upsertOne,
    collectionPositionSet(state, action: PayloadAction<{id: string, workspace: string, position: number[]}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.position = action.payload.position
      }
    },
    collectionTargetAdded(state, action: PayloadAction<{id: string, workspace: string, target: string}>) {
      const collection = state.entities[action.payload.id]
      if (collection) {
        collection.targets.push(action.payload.target)
      }
    }
  }
})

export default collectionsSlice.reducer


// actions
export const {
  collectionCreated,
  collectionUpdated,
  collectionPositionSet,
  collectionTargetAdded
} = collectionsSlice.actions


// selectors
export const {
  selectAll: selectCollections,
  selectById: selectCollectionById
} = collectionsAdapter.getSelectors<RootState>(state => state.collections)

export const selectCollectionIds = createSelector(
  selectCollections,
  collections => collections.map(collection => collection.id)
)

