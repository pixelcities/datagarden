import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Workspace } from 'types'

const workspacesAdapter = createEntityAdapter<Workspace>()


// reducers
const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState: workspacesAdapter.getInitialState(),
  reducers: {
    addWorkspace: workspacesAdapter.addOne,
    setWorkspacePosition(state, action: PayloadAction<{id: string, position: number[]}>) {
      const workspace = state.entities[action.payload.id]
      if (workspace) {
        workspace.position = action.payload.position
      }
    },
    addWorkspaceTarget(state, action: PayloadAction<{id: string, target: string}>) {
      const workspace = state.entities[action.payload.id]
      if (workspace) {
        workspace.targets.push(action.payload.target)
      }
    }
  }
})

export default workspacesSlice.reducer


// actions
export const {
  addWorkspace,
  setWorkspacePosition,
  addWorkspaceTarget
} = workspacesSlice.actions



// selectors
export const {
  selectAll: selectWorkspaces,
  selectById: selectWorkspaceById
} = workspacesAdapter.getSelectors<RootState>(state => state.workspaces)

export const selectWorkspaceIds = createSelector(
  selectWorkspaces,
  workspaces => workspaces.map(workspace => workspace.id)
)

