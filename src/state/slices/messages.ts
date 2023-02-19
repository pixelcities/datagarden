import { createSlice, createSelector, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Message } from 'types'

const messagesAdapter = createEntityAdapter<Message>()
const initialState = messagesAdapter.getInitialState()

// reducers
const messagesSlice = createSlice({
  name: 'messages',
  initialState: initialState,
  reducers: {
    sendLocalMessage: messagesAdapter.upsertOne,
    deleteLocalMessage(state, action: PayloadAction<{id: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    },

    messageReceived: messagesAdapter.upsertOne,
    messageRead(state, action: PayloadAction<{id: string, is_read: boolean}>) {
      const message = state.entities[action.payload.id]
      if (message) {
        message.is_read = action.payload.is_read
      }
    },
    messageDeleted(state, action: PayloadAction<{id: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default messagesSlice.reducer


// actions
export const {
  sendLocalMessage,
  deleteLocalMessage,

  messageReceived,
  messageRead,
  messageDeleted
} = messagesSlice.actions


// selectors
export const {
  selectAll: selectMessages
} = messagesAdapter.getSelectors<RootState>(state => state.messages)

export const selectUrgentMessages = createSelector(
  selectMessages,
  messages => messages.filter(message => (message.is_read === undefined || !message.is_read) && message.is_urgent)
)

