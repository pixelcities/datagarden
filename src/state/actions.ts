import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import {
  collectionCreated,
  collectionUpdated,
  collectionPositionSet,
  collectionTargetAdded
} from './slices/collections'

import {
  transformerCreated,
  transformerUpdated,
  transformerPositionSet,
  transformerTargetAdded,
  transformerInputAdded
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
  metadataCreated,
  metadataUpdated
} from './slices/metadata'

import {
  dataURICreated
} from './slices/uri'

import {
  secretShared
} from './slices/secrets'


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
const setCollectionPosition = recreateAction<typeof collectionPositionSet>("SetCollectionPosition")
const addCollectionTarget = recreateAction<typeof collectionTargetAdded>("AddCollectionTarget")
const createTransformer = recreateAction<typeof transformerCreated>("CreateTransformer")
const updateTransformer = recreateAction<typeof transformerUpdated>("UpdateTransformer")
const setTransformerPosition = recreateAction<typeof transformerPositionSet>("SetTransformerPosition")
const addTransformerTarget = recreateAction<typeof transformerTargetAdded>("AddTransformerTarget")
const addTransformerInput = recreateAction<typeof transformerInputAdded>("AddTransformerInput")
const createSource = recreateAction<typeof sourceCreated>("CreateSource")
const updateSource = recreateAction<typeof sourceUpdated>("UpdateSource")
const createDataURI = recreateAction<typeof dataURICreated>("CreateDataURI")
const createMetadata = recreateAction<typeof metadataCreated>("CreateMetadata")
const updateMetadata = recreateAction<typeof metadataUpdated>("UpdateMetadata")
const createUser = recreateAction<typeof userCreated>("CreateUser")
const updateUser = recreateAction<typeof userUpdated>("UpdateUser")
const shareSecret = recreateAction<typeof secretShared>("ShareSecret")

const events: {[key: string]: ActionCreatorWithPayload<any, string>} = {
  "CollectionCreated": collectionCreated,
  "CollectionUpdated": collectionUpdated,
  "CollectionPositionSet": collectionPositionSet,
  "CollectionTargetAdded": collectionTargetAdded,
  "TransformerCreated": transformerCreated,
  "TransformerUpdated": transformerUpdated,
  "TransformerPositionSet": transformerPositionSet,
  "TransformerTargetAdded": transformerTargetAdded,
  "TransformerInputAdded": transformerInputAdded,
  "SourceCreated": sourceCreated,
  "SourceUpdated": sourceUpdated,
  "DataURICreated": dataURICreated,
  "MetadataCreated": metadataCreated,
  "MetadataUpdated": metadataUpdated,
  "UserCreated": userCreated,
  "UserUpdated": userUpdated,
  "SecretShared": secretShared
}

export {
  events,
  login,

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
  setCollectionPosition,
  addCollectionTarget,
  createTransformer,
  updateTransformer,
  setTransformerPosition,
  addTransformerTarget,
  addTransformerInput,

  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget,
  addOrganisation,
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions
}
