import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createCachedSelector } from 're-reselect';
import { RootState } from 'state/store'
import { Coords, WindowDimensions, ComponentDimensions, UserInterface } from 'types'

// reducers
const initialState: UserInterface = {
  offset: {x: 0,y: 0},
  coords: {x: 0, y: 0},
  dimensions: {height: 0, width: 0},
  components: {},
  connectionState: "connected"
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialState,
  reducers: {
    setOffset(state, action: PayloadAction<Coords>) {
      state.offset = action.payload
    },
    setCoords(state, action: PayloadAction<Coords>) {
      state.coords = action.payload
    },
    setWindowDimensions(state, action: PayloadAction<WindowDimensions>) {
      state.dimensions = action.payload
    },
    setComponentDimensions(state, action: PayloadAction<ComponentDimensions>) {
      state.components[action.payload.id] = action.payload
    },
    setConnectionState(state, action: PayloadAction<string>) {
      state.connectionState = action.payload
    }
  }
})

export default uiSlice.reducer


// actions
export const {
  setOffset,
  setCoords,
  setWindowDimensions,
  setComponentDimensions,
  setConnectionState
} = uiSlice.actions


// selectors
const uiSelector = (state: RootState) => state.ui

export const selectOffset = createSelector(
  uiSelector,
  ui => ui.offset
)

export const selectCoords = createSelector(
  uiSelector,
  ui => ui.coords
)

export const selectWindowDimensions = createSelector(
  uiSelector,
  ui => ui.dimensions
)

export const selectConnectionState = createSelector(
  uiSelector,
  ui => ui.connectionState
)

export const selectComponentDimensionsById = createCachedSelector(
  uiSelector,
  (_: RootState, id: string) => id,
  (ui, componentId): ComponentDimensions | undefined => {
    return ui.components[componentId]
  }
)(
  (_state_, componentId) => componentId
)

