import { createSelector, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Page } from 'types'

const pagesAdapter = createEntityAdapter<Page>()


// reducers
const pagesSlice = createSlice({
  name: 'pages',
  initialState: pagesAdapter.getInitialState(),
  reducers: {
    pageCreated: pagesAdapter.addOne,
    pageUpdated: pagesAdapter.upsertOne,
    pageOrderSet(state, action: PayloadAction<{id: string, workspace: string, content_order: string[]}>) {
      const page = state.entities[action.payload.id]
      if (page) {
        page.content_order = action.payload.content_order
      }
    },
    pageDeleted(state, action: PayloadAction<{id: string, workspace: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default pagesSlice.reducer


// actions
export const {
  pageCreated,
  pageUpdated,
  pageOrderSet,
  pageDeleted
} = pagesSlice.actions


// selectors
export const {
  selectAll: selectPages,
  selectById: selectPageById
} = pagesAdapter.getSelectors<RootState>(state => state.pages)

export const selectPageIds = createSelector(
  selectPages,
  pages => pages.map(page => page.id)
)

