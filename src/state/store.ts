import { configureStore } from '@reduxjs/toolkit'

import { websocketMiddleware } from 'middleware/websockets'

import collectionsReducer from './slices/collections'
import transformersReducer from './slices/transformers'
import workspacesReducer from './slices/workspaces'
import sourceReducer from './slices/sources'
import organisationReducer from './slices/organisations'
import uiReducer from './slices/ui'
import userReducer from './slices/users'
import metadataReducer from './slices/metadata'
import uriReducer from './slices/uri'
import secretReducer from './slices/secrets'
import taskReducer from './slices/tasks'

const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(websocketMiddleware),
  reducer: {
    collections: collectionsReducer,
    transformers: transformersReducer,
    workspaces: workspacesReducer,
    sources: sourceReducer,
    organisations: organisationReducer,
    ui: uiReducer,
    users: userReducer,
    metadata: metadataReducer,
    uris: uriReducer,
    secrets: secretReducer,
    tasks: taskReducer
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
