import { createSlice, createSelector, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { NotificationMsg } from 'types'

const notificationsAdapter = createEntityAdapter<NotificationMsg>()
const initialState = notificationsAdapter.getInitialState()

// reducers
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: initialState,
  reducers: {
    sendLocalNotification: notificationsAdapter.upsertOne,
    deleteLocalNotification(state, action: PayloadAction<{id: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    },

    userNotificationSent: notificationsAdapter.upsertOne,
    notificationRead(state, action: PayloadAction<{id: string, read_by: string}>) {
      const notification = state.entities[action.payload.id]
      if (notification) {
        notification.is_read = true
      }
    }
  }
})

export default notificationsSlice.reducer


// actions
export const {
  sendLocalNotification,
  deleteLocalNotification,

  userNotificationSent,
  notificationRead
} = notificationsSlice.actions


// selectors
export const {
  selectAll: selectNotifications
} = notificationsAdapter.getSelectors<RootState>(state => state.notifications)

export const selectUrgentNotifications = createSelector(
  selectNotifications,
  notifications => notifications.filter(notification => (notification.is_read === undefined || !notification.is_read) && notification.is_urgent)
)

