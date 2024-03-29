import { configureStore, combineReducers, AnyAction } from '@reduxjs/toolkit'

import { websocketMiddleware } from 'middleware/websockets'

import collectionsReducer from './slices/collections'
import transformersReducer from './slices/transformers'
import widgetsReducer from './slices/widgets'
import workspacesReducer from './slices/workspaces'
import sourceReducer from './slices/sources'
import organisationReducer from './slices/organisations'
import uiReducer from './slices/ui'
import userReducer from './slices/users'
import userInviteReducer from './slices/invites'
import dataspaceReducer from './slices/dataspaces'
import metadataReducer from './slices/metadata'
import conceptReducer from './slices/concepts'
import uriReducer from './slices/uri'
import secretReducer from './slices/secrets'
import taskReducer from './slices/tasks'
import contentReducer from './slices/content'
import pageReducer from './slices/pages'
import notificationReducer from './slices/notifications'
import mpcReducer from './slices/mpc'


const rootReducer = combineReducers({
  collections: collectionsReducer,
  transformers: transformersReducer,
  widgets: widgetsReducer,
  workspaces: workspacesReducer,
  sources: sourceReducer,
  organisations: organisationReducer,
  ui: uiReducer,
  users: userReducer,
  userInvites: userInviteReducer,
  dataspaces: dataspaceReducer,
  metadata: metadataReducer,
  concepts: conceptReducer,
  uris: uriReducer,
  secrets: secretReducer,
  tasks: taskReducer,
  content: contentReducer,
  pages: pageReducer,
  notifications: notificationReducer,
  mpc: mpcReducer
})

const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(websocketMiddleware),
  reducer: (state: any, action: AnyAction) => {
    // All state is unique per dataspace
    //
    // To help this fact, there are some special actions that are intercepted
    // in the root reducer. One to wipe the state clean when leaving a dataspace,
    // and another to quickly restore local cached state. Both are managed by the
    // websockets middleware as it should stay in sync with the server.

    if (action.type === "dataspaces/leaveDataSpace") {
      return rootReducer(undefined, action)
    }

    if (action.type === "dataspaces/loadDataSpace") {
      return rootReducer({...state, ...action.payload}, action)
    }

    return rootReducer(state, action)
  }
})


export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
