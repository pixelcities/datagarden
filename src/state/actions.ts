import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import {
  collectionCreated,
  collectionUpdated,
  collectionSchemaUpdated,
  collectionPositionSet,
  collectionIsReadySet,
  collectionTargetAdded,
  collectionTargetRemoved,
  collectionDeleted
} from './slices/collections'

import {
  transformerCreated,
  transformerUpdated,
  transformerPositionSet,
  transformerTargetAdded,
  transformerInputAdded,
  transformerWALUpdated,
  transformerDeleted
} from './slices/transformers'

import {
  widgetCreated,
  widgetUpdated,
  widgetPositionSet,
  widgetInputAdded,
  widgetSettingPut,
  widgetPublished,
  widgetDeleted
} from './slices/widgets'

import {
  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget
} from './slices/workspaces'

import {
  sourceCreated,
  sourceUpdated,
  sourceDeleted
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
  conceptCreated,
  conceptUpdated
} from './slices/concepts'

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

import {
  pageCreated,
  pageUpdated,
  pageOrderSet,
  pageDeleted
} from './slices/pages'

import {
  contentCreated,
  contentUpdated,
  contentDraftUpdated,
  contentDeleted
} from './slices/content'


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
const deleteCollection = recreateAction<typeof collectionDeleted>("DeleteCollection")
const createTransformer = recreateAction<typeof transformerCreated>("CreateTransformer")
const updateTransformer = recreateAction<typeof transformerUpdated>("UpdateTransformer")
const setTransformerPosition = recreateAction<typeof transformerPositionSet>("SetTransformerPosition")
const addTransformerTarget = recreateAction<typeof transformerTargetAdded>("AddTransformerTarget")
const addTransformerInput = recreateAction<typeof transformerInputAdded>("AddTransformerInput")
const updateTransformerWAL = recreateAction<typeof transformerWALUpdated>("UpdateTransformerWAL")
const deleteTransformer = recreateAction<typeof transformerDeleted>("DeleteTransformer")
const createWidget = recreateAction<typeof widgetCreated>("CreateWidget")
const updateWidget = recreateAction<typeof widgetUpdated>("UpdateWidget")
const setWidgetPosition = recreateAction<typeof widgetPositionSet>("SetWidgetPosition")
const addWidgetInput = recreateAction<typeof widgetInputAdded>("AddWidgetInput")
const putWidgetSetting = recreateAction<typeof widgetSettingPut>("PutWidgetSetting")
const publishWidget = recreateAction<typeof widgetPublished>("PublishWidget")
const deleteWidget = recreateAction<typeof widgetDeleted>("DeleteWidget")
const createSource = recreateAction<typeof sourceCreated>("CreateSource")
const updateSource = recreateAction<typeof sourceUpdated>("UpdateSource")
const deleteSource = recreateAction<typeof sourceDeleted>("DeleteSource")
const createDataURI = recreateAction<typeof dataURICreated>("CreateDataURI")
const createMetadata = recreateAction<typeof metadataCreated>("CreateMetadata")
const updateMetadata = recreateAction<typeof metadataUpdated>("UpdateMetadata")
const createConcept = recreateAction<typeof conceptCreated>("CreateConcept")
const updateConcept = recreateAction<typeof conceptUpdated>("UpdateConcept")
const createUser = recreateAction<typeof userCreated>("CreateUser")
const updateUser = recreateAction<typeof userUpdated>("UpdateUser")
const shareSecret = recreateAction<typeof secretShared>("ShareSecret")
const completeTask = recreateAction<typeof taskCompleted>("CompleteTask")
const createPage = recreateAction<typeof pageCreated>("CreatePage")
const updatePage = recreateAction<typeof pageUpdated>("UpdatePage")
const setPageOrder = recreateAction<typeof pageOrderSet>("SetPageOrder")
const deletePage = recreateAction<typeof pageDeleted>("DeletePage")
const createContent = recreateAction<typeof contentCreated>("CreateContent")
const updateContent = recreateAction<typeof contentUpdated>("UpdateContent")
const updateContentDraft = recreateAction<typeof contentDraftUpdated>("UpdateContentDraft")
const deleteContent = recreateAction<typeof contentDeleted>("DeleteContent")

const events: {[key: string]: ActionCreatorWithPayload<any, string>} = {
  "CollectionCreated": collectionCreated,
  "CollectionUpdated": collectionUpdated,
  "CollectionSchemaUpdated": collectionSchemaUpdated,
  "CollectionPositionSet": collectionPositionSet,
  "CollectionIsReadySet": collectionIsReadySet,
  "CollectionTargetAdded": collectionTargetAdded,
  "CollectionTargetRemoved": collectionTargetRemoved,
  "CollectionDeleted": collectionDeleted,
  "TransformerCreated": transformerCreated,
  "TransformerUpdated": transformerUpdated,
  "TransformerPositionSet": transformerPositionSet,
  "TransformerTargetAdded": transformerTargetAdded,
  "TransformerInputAdded": transformerInputAdded,
  "TransformerWALUpdated": transformerWALUpdated,
  "TransformerDeleted": transformerDeleted,
  "WidgetCreated": widgetCreated,
  "WidgetUpdated": widgetUpdated,
  "WidgetPositionSet": widgetPositionSet,
  "WidgetInputAdded": widgetInputAdded,
  "WidgetSettingPut": widgetSettingPut,
  "WidgetPublished": widgetPublished,
  "WidgetDeleted": widgetDeleted,
  "SourceCreated": sourceCreated,
  "SourceUpdated": sourceUpdated,
  "SourceDeleted": sourceDeleted,
  "DataURICreated": dataURICreated,
  "MetadataCreated": metadataCreated,
  "MetadataUpdated": metadataUpdated,
  "ConceptCreated": conceptCreated,
  "ConceptUpdated": conceptUpdated,
  "UserCreated": userCreated,
  "UserUpdated": userUpdated,
  "SecretShared": secretShared,
  "TaskAssigned": taskAssigned,
  "TaskCompleted": taskCompleted,
  "PageCreated": pageCreated,
  "PageUpdated": pageUpdated,
  "PageOrderSet": pageOrderSet,
  "PageDeleted": pageDeleted,
  "ContentCreated": contentCreated,
  "ContentUpdated": contentUpdated,
  "ContentDraftUpdated": contentDraftUpdated,
  "ContentDeleted": contentDeleted
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
  deleteSource,
  createMetadata,
  updateMetadata,
  createConcept,
  updateConcept,
  createDataURI,
  shareSecret,
  createCollection,
  updateCollection,
  updateCollectionSchema,
  setCollectionPosition,
  setCollectionIsReady,
  addCollectionTarget,
  deleteCollection,
  createTransformer,
  updateTransformer,
  setTransformerPosition,
  addTransformerTarget,
  addTransformerInput,
  updateTransformerWAL,
  deleteTransformer,
  createWidget,
  updateWidget,
  setWidgetPosition,
  addWidgetInput,
  putWidgetSetting,
  publishWidget,
  deleteWidget,
  completeTask,
  createPage,
  updatePage,
  setPageOrder,
  deletePage,
  createContent,
  updateContent,
  updateContentDraft,
  deleteContent,

  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget,
  addOrganisation,
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions
}
