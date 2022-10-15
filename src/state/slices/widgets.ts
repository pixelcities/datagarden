import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Widget } from 'types'

const widgetsAdapter = createEntityAdapter<Widget>()


// reducers
const widgetsSlice = createSlice({
  name: 'widgets',
  initialState: widgetsAdapter.getInitialState(),
  reducers: {
    widgetCreated: widgetsAdapter.addOne,
    widgetUpdated: widgetsAdapter.upsertOne,
    widgetPositionSet(state, action: PayloadAction<{id: string, workspace: string, position: number[]}>) {
      const widget = state.entities[action.payload.id]
      if (widget) {
        widget.position = action.payload.position
      }
    },
    widgetInputAdded(state, action: PayloadAction<{id: string, workspace: string, collection: string, widget: string}>) {
      const widget = state.entities[action.payload.id]

      if (widget) {
        widget.collection = action.payload.collection
      }
    },
    widgetDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default widgetsSlice.reducer


// actions
export const {
  widgetCreated,
  widgetUpdated,
  widgetPositionSet,
  widgetInputAdded,
  widgetDeleted
} = widgetsSlice.actions


// selectors
export const {
  selectAll: selectWidgets,
  selectById: selectWidgetById
} = widgetsAdapter.getSelectors<RootState>(state => state.widgets)

export const selectWidgetIds = createSelector(
  selectWidgets,
  widgets => widgets.map(widget => widget.id)
)

