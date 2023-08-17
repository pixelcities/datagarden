import { createAction, ActionCreatorWithPayload } from '@reduxjs/toolkit'

import {
  collectionCreated,
  collectionUpdated,
  collectionSchemaUpdated,
  collectionColorSet,
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
  transformerIsReadySet,
  transformerErrorSet,
  transformerTargetAdded,
  transformerInputAdded,
  transformerWALUpdated,
  transformerApproved,
  transformerDeleted
} from './slices/transformers'

import {
  widgetCreated,
  widgetUpdated,
  widgetPositionSet,
  widgetIsReadySet,
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
  sourceDeleted,
  sourceURIUpdated
} from './slices/sources'

import {
  addOrganisation
} from './slices/organisations'

import {
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions,
  setConnectionState,
  setIsLoading
} from './slices/ui'

import {
  login,
  userCreated,
  userUpdated
} from './slices/users'

import {
  userInvited,
  inviteAccepted,
  inviteConfirmed,
  inviteCancelled
} from './slices/invites'

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
  conceptUpdated,
  conceptDeleted
} from './slices/concepts'

import {
  dataURICreated
} from './slices/uri'

import {
  secretShared,
  deleteLocalSecret
} from './slices/secrets'

import {
  taskAssigned,
  taskCompleted,
  taskFailed,
  deleteLocalTask
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

import {
  sendLocalNotification,
  deleteLocalNotification,

  userNotificationSent,
  notificationRead
} from './slices/notifications'

import {
  mpcCreated,
  mpcPartialShared,
  mpcResultShared
} from './slices/mpc'


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
const setCollectionColor = recreateAction<typeof collectionColorSet>("SetCollectionColor")
const setCollectionPosition = recreateAction<typeof collectionPositionSet>("SetCollectionPosition")
const setCollectionIsReady = recreateAction<typeof collectionIsReadySet>("SetCollectionIsReady")
const addCollectionTarget = recreateAction<typeof collectionTargetAdded>("AddCollectionTarget")
const deleteCollection = recreateAction<typeof collectionDeleted>("DeleteCollection")
const createTransformer = recreateAction<typeof transformerCreated>("CreateTransformer")
const updateTransformer = recreateAction<typeof transformerUpdated>("UpdateTransformer")
const setTransformerPosition = recreateAction<typeof transformerPositionSet>("SetTransformerPosition")
const setTransformerIsReady = recreateAction<typeof transformerIsReadySet>("SetTransformerIsReady")
const addTransformerTarget = recreateAction<typeof transformerTargetAdded>("AddTransformerTarget")
const addTransformerInput = recreateAction<typeof transformerInputAdded>("AddTransformerInput")
const updateTransformerWAL = recreateAction<typeof transformerWALUpdated>("UpdateTransformerWAL")
const approveTransformer = recreateAction<typeof transformerApproved>("ApproveTransformer")
const deleteTransformer = recreateAction<typeof transformerDeleted>("DeleteTransformer")
const createWidget = recreateAction<typeof widgetCreated>("CreateWidget")
const updateWidget = recreateAction<typeof widgetUpdated>("UpdateWidget")
const setWidgetPosition = recreateAction<typeof widgetPositionSet>("SetWidgetPosition")
const setWidgetIsReady = recreateAction<typeof widgetIsReadySet>("SetWidgetIsReady")
const addWidgetInput = recreateAction<typeof widgetInputAdded>("AddWidgetInput")
const putWidgetSetting = recreateAction<typeof widgetSettingPut>("PutWidgetSetting")
const publishWidget = recreateAction<typeof widgetPublished>("PublishWidget")
const deleteWidget = recreateAction<typeof widgetDeleted>("DeleteWidget")
const createSource = recreateAction<typeof sourceCreated>("CreateSource")
const updateSource = recreateAction<typeof sourceUpdated>("UpdateSource")
const deleteSource = recreateAction<typeof sourceDeleted>("DeleteSource")
const updateSourceURI = recreateAction<typeof sourceURIUpdated>("UpdateSourceURI")
const createDataURI = recreateAction<typeof dataURICreated>("CreateDataURI")
const createMetadata = recreateAction<typeof metadataCreated>("CreateMetadata")
const updateMetadata = recreateAction<typeof metadataUpdated>("UpdateMetadata")
const createConcept = recreateAction<typeof conceptCreated>("CreateConcept")
const updateConcept = recreateAction<typeof conceptUpdated>("UpdateConcept")
const deleteConcept = recreateAction<typeof conceptDeleted>("DeleteConcept")
const createUser = recreateAction<typeof userCreated>("CreateUser")
const updateUser = recreateAction<typeof userUpdated>("UpdateUser")
const shareSecret = recreateAction<typeof secretShared>("ShareSecret")
const completeTask = recreateAction<typeof taskCompleted>("CompleteTask")
const failTask = recreateAction<typeof taskFailed>("FailTask")
const createPage = recreateAction<typeof pageCreated>("CreatePage")
const updatePage = recreateAction<typeof pageUpdated>("UpdatePage")
const setPageOrder = recreateAction<typeof pageOrderSet>("SetPageOrder")
const deletePage = recreateAction<typeof pageDeleted>("DeletePage")
const createContent = recreateAction<typeof contentCreated>("CreateContent")
const updateContent = recreateAction<typeof contentUpdated>("UpdateContent")
const updateContentDraft = recreateAction<typeof contentDraftUpdated>("UpdateContentDraft")
const deleteContent = recreateAction<typeof contentDeleted>("DeleteContent")
const markNotificationRead = recreateAction<typeof notificationRead>("MarkNotificationRead")
const createMPC = recreateAction<typeof mpcCreated>("CreateMPC")
const shareMPCPartial = recreateAction<typeof mpcPartialShared>("ShareMPCPartial")

const events: {[key: string]: ActionCreatorWithPayload<any, string>} = {
  "CollectionCreated": collectionCreated,
  "CollectionUpdated": collectionUpdated,
  "CollectionSchemaUpdated": collectionSchemaUpdated,
  "CollectionColorSet": collectionColorSet,
  "CollectionPositionSet": collectionPositionSet,
  "CollectionIsReadySet": collectionIsReadySet,
  "CollectionTargetAdded": collectionTargetAdded,
  "CollectionTargetRemoved": collectionTargetRemoved,
  "CollectionDeleted": collectionDeleted,
  "TransformerCreated": transformerCreated,
  "TransformerUpdated": transformerUpdated,
  "TransformerPositionSet": transformerPositionSet,
  "TransformerIsReadySet": transformerIsReadySet,
  "TransformerErrorSet": transformerErrorSet,
  "TransformerTargetAdded": transformerTargetAdded,
  "TransformerInputAdded": transformerInputAdded,
  "TransformerWALUpdated": transformerWALUpdated,
  "TransformerDeleted": transformerDeleted,
  "TransformerApproved": transformerApproved,
  "WidgetCreated": widgetCreated,
  "WidgetUpdated": widgetUpdated,
  "WidgetPositionSet": widgetPositionSet,
  "WidgetIsReadySet": widgetIsReadySet,
  "WidgetInputAdded": widgetInputAdded,
  "WidgetSettingPut": widgetSettingPut,
  "WidgetPublished": widgetPublished,
  "WidgetDeleted": widgetDeleted,
  "SourceCreated": sourceCreated,
  "SourceUpdated": sourceUpdated,
  "SourceDeleted": sourceDeleted,
  "SourceURIUpdated": sourceURIUpdated,
  "DataURICreated": dataURICreated,
  "MetadataCreated": metadataCreated,
  "MetadataUpdated": metadataUpdated,
  "ConceptCreated": conceptCreated,
  "ConceptUpdated": conceptUpdated,
  "ConceptDeleted": conceptDeleted,
  "UserCreated": userCreated,
  "UserUpdated": userUpdated,
  "UserInvited": userInvited,
  "InviteAccepted": inviteAccepted,
  "InviteConfirmed": inviteConfirmed,
  "InviteCancelled": inviteCancelled,
  "SecretShared": secretShared,
  "TaskAssigned": taskAssigned,
  "TaskCompleted": taskCompleted,
  "TaskFailed": taskFailed,
  "PageCreated": pageCreated,
  "PageUpdated": pageUpdated,
  "PageOrderSet": pageOrderSet,
  "PageDeleted": pageDeleted,
  "ContentCreated": contentCreated,
  "ContentUpdated": contentUpdated,
  "ContentDraftUpdated": contentDraftUpdated,
  "ContentDeleted": contentDeleted,
  "UserNotificationSent": userNotificationSent,
  "NotificationRead": notificationRead,
  "MPCCreated": mpcCreated,
  "MPCResultShared": mpcResultShared
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
  updateSourceURI,
  createMetadata,
  updateMetadata,
  createConcept,
  updateConcept,
  deleteConcept,
  createDataURI,
  shareSecret,
  createCollection,
  updateCollection,
  updateCollectionSchema,
  setCollectionColor,
  setCollectionPosition,
  setCollectionIsReady,
  addCollectionTarget,
  deleteCollection,
  createTransformer,
  updateTransformer,
  setTransformerPosition,
  setTransformerIsReady,
  addTransformerTarget,
  addTransformerInput,
  updateTransformerWAL,
  approveTransformer,
  deleteTransformer,
  createWidget,
  updateWidget,
  setWidgetPosition,
  setWidgetIsReady,
  addWidgetInput,
  putWidgetSetting,
  publishWidget,
  deleteWidget,
  completeTask,
  failTask,
  createPage,
  updatePage,
  setPageOrder,
  deletePage,
  createContent,
  updateContent,
  updateContentDraft,
  deleteContent,
  markNotificationRead,
  createMPC,
  shareMPCPartial,

  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget,
  addOrganisation,
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions,
  setConnectionState,
  setIsLoading,
  sendLocalNotification,
  deleteLocalNotification,
  deleteLocalTask,
  deleteLocalSecret
}
