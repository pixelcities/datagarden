import { createSelector } from '@reduxjs/toolkit'
import { createCachedSelector } from 're-reselect';
import { Component } from 'types'
import { RootState } from 'state/store'

// import isolated selectors
import {
  selectCollections,
  selectCollectionById,
  selectCollectionIds
} from './slices/collections'

import {
  selectTransformers,
  selectTransformerById,
  selectTransformerIds
} from './slices/transformers'

import {
  selectWorkspaces,
  selectWorkspaceById,
  selectWorkspaceIds
} from './slices/workspaces'

import {
  selectSources,
  selectSourceById,
  selectVisibleSources,
  selectUsableSources
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
  selectMetadata,
  selectMetadataById,
  selectMetadataMap
} from './slices/metadata'

import {
  selectDataURIById
} from './slices/uri'

import {
  selectSecrets
} from './slices/secrets'


// union views
export const selectComponents = createCachedSelector(
  selectCollections,
  selectTransformers,
  (_: RootState, workspace: string) => workspace,
  (collections, transformers, workspaceId): Component[] => {
    return [...collections, ...transformers].filter(component => component.workspace === workspaceId)
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
  (_: RootState, id: string) => id,
  (collections, transformers, componentId): Component | undefined => {
    return ([...collections, ...transformers] as Component[]).find(component => component.id === componentId)
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

// re-export
export {
  selectCollections,
  selectCollectionById,
  selectCollectionIds,
  selectTransformers,
  selectTransformerById,
  selectTransformerIds,
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
  selectMetadata,
  selectMetadataById,
  selectMetadataMap,
  selectDataURIById,
  selectSecrets
}
