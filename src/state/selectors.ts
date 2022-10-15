import { createSelector } from '@reduxjs/toolkit'
import { createCachedSelector } from 're-reselect';
import { Component, Concept } from 'types'
import { RootState } from 'state/store'

// import isolated selectors
import {
  selectCollections,
  selectCollectionById,
  selectCollectionsByIds,
  selectCollectionIds,
  selectCollectionConceptIdMap
} from './slices/collections'

import {
  selectTransformers,
  selectTransformerById,
  selectTransformerIds
} from './slices/transformers'

import {
  selectWidgets,
  selectWidgetById,
  selectWidgetIds
} from './slices/widgets'

import {
  selectWorkspaces,
  selectWorkspaceById,
  selectWorkspaceIds
} from './slices/workspaces'

import {
  selectSources,
  selectSourceById,
  selectVisibleSources,
  selectUsableSources,
  selectSourceConceptIdMap
} from './slices/sources'

import {
  selectOrganisations,
  selectOrganisationById
} from './slices/organisations'

import {
  selectOffset,
  selectCoords,
  selectWindowDimensions,
  selectComponentDimensionsById
} from './slices/ui'

import {
  selectUsers,
  selectUserById,
  selectUserByEmail,
  selectSelf
} from './slices/users'

import {
  selectActiveDataSpace
} from './slices/dataspaces'

import {
  selectMetadata,
  selectMetadataById,
  selectMetadataMap
} from './slices/metadata'

import {
  selectConcepts,
  selectConceptById,
  selectConceptMap
} from './slices/concepts'

import {
  selectDataURIById
} from './slices/uri'

import {
  selectSecrets
} from './slices/secrets'

import {
  selectTasks
} from './slices/tasks'


// union views
export const selectComponents = createCachedSelector(
  selectCollections,
  selectTransformers,
  selectWidgets,
  (_: RootState, workspace: string) => workspace,
  (collections, transformers, widgets, workspaceId): Component[] => {
    return [...collections, ...transformers, ...widgets].filter(component => component.workspace === workspaceId)
  }
)(
  (_state_, workspaceId) => workspaceId
)

export const selectConnectedComponents = createCachedSelector(
  selectCollections,
  selectTransformers,
  (_: RootState, workspace: string) => workspace,
  (collections, transformers, workspaceId): Component[] => {
    return [...collections, ...transformers]
      .filter(component => component.workspace === workspaceId)
      .filter(component => component.targets.length > 0)
  }
)(
  (_state_, workspaceId) => workspaceId
)

export const selectComponentById = createCachedSelector(
  selectCollections,
  selectTransformers,
  selectWidgets,
  (_: RootState, id: string) => id,
  (collections, transformers, widgets, componentId): Component | undefined => {
    return ([...collections, ...transformers, ...widgets] as Component[]).find(component => component.id === componentId)
  }
)(
  (_state_, componentId) => componentId
)

export const selectSourcesWithOwner = createSelector(
  selectSources,
  selectOrganisations,
  (sources, organisations) => {
    return sources.map(source => {
      return {...source, ...{owner: organisations.find(org => org.id === source.owner)}}
    })
  }
)

export const selectColumnConceptMap = createSelector(
  selectCollectionConceptIdMap,
  selectSourceConceptIdMap,
  selectConceptMap,
  (collections, sources, concepts): {[key: string]: Concept} => {
    return Object.entries({...sources, ...collections})
      .reduce((acc: {[key: string]: Concept}, [columnId, conceptId]) => ({...acc, [columnId]: concepts[conceptId]}), {})
  }
)


// re-export
export {
  selectCollections,
  selectCollectionById,
  selectCollectionsByIds,
  selectCollectionIds,
  selectTransformers,
  selectTransformerById,
  selectTransformerIds,
  selectWidgets,
  selectWidgetById,
  selectWidgetIds,
  selectWorkspaces,
  selectWorkspaceById,
  selectWorkspaceIds,
  selectSources,
  selectSourceById,
  selectVisibleSources,
  selectUsableSources,
  selectOrganisations,
  selectOrganisationById,
  selectOffset,
  selectCoords,
  selectWindowDimensions,
  selectComponentDimensionsById,
  selectUsers,
  selectUserById,
  selectUserByEmail,
  selectSelf,
  selectActiveDataSpace,
  selectMetadata,
  selectMetadataById,
  selectMetadataMap,
  selectConcepts,
  selectConceptById,
  selectConceptMap,
  selectDataURIById,
  selectSecrets,
  selectTasks
}
