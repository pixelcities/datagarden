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

