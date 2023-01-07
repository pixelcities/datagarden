import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Content } from 'types'

const contentAdapter = createEntityAdapter<Content>()


// reducers
const contentSlice = createSlice({
  name: 'content',
  initialState: contentAdapter.getInitialState(),
  reducers: {
    contentCreated: contentAdapter.addOne,
    contentUpdated: contentAdapter.upsertOne,
    contentDraftUpdated(state, action: PayloadAction<{id: string, workspace: string, draft: string}>) {
      const content = state.entities[action.payload.id]
      if (content) {
        content.draft = action.payload.draft
      }
    },
    contentDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default contentSlice.reducer


// actions
export const {
  contentCreated,
  contentUpdated,
  contentDraftUpdated,
  contentDeleted
} = contentSlice.actions


// selectors
export const {
  selectAll: selectContent,
  selectById: selectContentById
} = contentAdapter.getSelectors<RootState>(state => state.content)

export const selectContentIds = createSelector(
  selectContent,
  content => content.map(c => c.id)
)

export const selectContentHeightById = createSelector(
  selectContentById,
  content => content?.height
)

export const selectContentByPageId = createSelector(
  selectContent,
  (_: RootState, pageId: string) => pageId,
  (content, pageId) => content.filter(x => x.page_id === pageId)
)

export const selectContentIdsByPageId = createSelector(
  selectContent,
  (_: RootState, pageId: string) => pageId,
  (content, pageId) => content.filter(x => x.page_id === pageId).map(c => c.id)
)

export const selectContentByWidgetId = createSelector(
  selectContent,
  (_: RootState, widgetId: string) => widgetId,
  (content, widgetId) => content.filter(x => x.widget_id === widgetId)
)


