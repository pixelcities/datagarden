import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import {
  collectionCreated,
  collectionUpdated,
  collectionSchemaUpdated,
  collectionPositionSet,
  collectionIsReadySet,
  collectionTargetAdded
} from './slices/collections'

import {
  transformerCreated,
  transformerUpdated,
  transformerPositionSet,
  transformerTargetAdded,
  transformerInputAdded,
  transformerWALUpdated
} from './slices/transformers'

import {
  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget
} from './slices/workspaces'

import {
  sourceCreated,
  sourceUpdated
} from './slices/sources'

import {
  addOrganisation
} from './slices/organisations'

import {
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions
} from './slices/ui'

import {
  login,
  userCreated,
  userUpdated
} from './slices/users'

import {
  setActiveDataSpace,
  leaveDataSpace,
  loadDataSpace
} from './slices/dataspaces'


import {
  metadataCreated,
  metadataUpdated
} from './slices/metadata'

import {
  dataURICreated
} from './slices/uri'

import {
  secretShared
} from './slices/secrets'

import {
  taskAssigned,
  taskCompleted
} from './slices/tasks'


const recreateAction = <T extends ActionCreatorWithPayload<any,string>>(type: string): T => {
  return createAction(type, (action) => {
    return {
      payload: {

        // Create our desired payload, while also allowing the middleware to distinguish between
        // commands and normal actions. It will fire any payload within the "command" key to the
        // server.
        command: {
          type: type,
          payload: action
        }
      }
    }
  }) as T
}

const createCollection = recreateAction<typeof collectionCreated>("CreateCollection")
const updateCollection = recreateAction<typeof collectionUpdated>("UpdateCollection")
const updateCollectionSchema = recreateAction<typeof collectionSchemaUpdated>("UpdateCollectionSchema")
const setCollectionPosition = recreateAction<typeof collectionPositionSet>("SetCollectionPosition")
const setCollectionIsReady = recreateAction<typeof collectionIsReadySet>("SetCollectionIsReady")
const addCollectionTarget = recreateAction<typeof collectionTargetAdded>("AddCollectionTarget")
const createTransformer = recreateAction<typeof transformerCreated>("CreateTransformer")
const updateTransformer = recreateAction<typeof transformerUpdated>("UpdateTransformer")
const setTransformerPosition = recreateAction<typeof transformerPositionSet>("SetTransformerPosition")
const addTransformerTarget = recreateAction<typeof transformerTargetAdded>("AddTransformerTarget")
const addTransformerInput = recreateAction<typeof transformerInputAdded>("AddTransformerInput")
const updateTransformerWAL = recreateAction<typeof transformerWALUpdated>("UpdateTransformerWAL")
const createSource = recreateAction<typeof sourceCreated>("CreateSource")
const updateSource = recreateAction<typeof sourceUpdated>("UpdateSource")
const createDataURI = recreateAction<typeof dataURICreated>("CreateDataURI")
const createMetadata = recreateAction<typeof metadataCreated>("CreateMetadata")
const updateMetadata = recreateAction<typeof metadataUpdated>("UpdateMetadata")
const createUser = recreateAction<typeof userCreated>("CreateUser")
const updateUser = recreateAction<typeof userUpdated>("UpdateUser")
const shareSecret = recreateAction<typeof secretShared>("ShareSecret")
const completeTask = recreateAction<typeof taskCompleted>("CompleteTask")

const events: {[key: string]: ActionCreatorWithPayload<any, string>} = {
  "CollectionCreated": collectionCreated,
  "CollectionUpdated": collectionUpdated,
  "CollectionSchemaUpdated": collectionSchemaUpdated,
  "CollectionPositionSet": collectionPositionSet,
  "CollectionIsReadySet": collectionIsReadySet,
  "CollectionTargetAdded": collectionTargetAdded,
  "TransformerCreated": transformerCreated,
  "TransformerUpdated": transformerUpdated,
  "TransformerPositionSet": transformerPositionSet,
  "TransformerTargetAdded": transformerTargetAdded,
  "TransformerInputAdded": transformerInputAdded,
  "TransformerWALUpdated": transformerWALUpdated,
  "SourceCreated": sourceCreated,
  "SourceUpdated": sourceUpdated,
  "DataURICreated": dataURICreated,
  "MetadataCreated": metadataCreated,
  "MetadataUpdated": metadataUpdated,
  "UserCreated": userCreated,
  "UserUpdated": userUpdated,
  "SecretShared": secretShared,
  "TaskAssigned": taskAssigned,
  "TaskCompleted": taskCompleted
}

export {
  events,
  login,
  setActiveDataSpace,
  leaveDataSpace,
  loadDataSpace,

  createUser,
  updateUser,
  createSource,
  updateSource,
  createMetadata,
  updateMetadata,
  createDataURI,
  shareSecret,
  createCollection,
  updateCollection,
  updateCollectionSchema,
  setCollectionPosition,
  setCollectionIsReady,
  addCollectionTarget,
  createTransformer,
  updateTransformer,
  setTransformerPosition,
  addTransformerTarget,
  addTransformerInput,
  updateTransformerWAL,
  completeTask,

  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget,
  addOrganisation,
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions
}
