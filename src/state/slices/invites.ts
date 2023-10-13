import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { UserInvite } from 'types'

const userInvitesAdapter = createEntityAdapter<UserInvite>({
  selectId: (userInvite) => userInvite.email
})
const initialState = userInvitesAdapter.getInitialState()

// reducers
const userInvitesSlice = createSlice({
  name: 'userInvites',
  initialState: initialState,
  reducers: {
    userInvited: userInvitesAdapter.addOne,
    inviteAccepted(state, action: PayloadAction<{email: string, id: string}>) {
      const userInvite = state.entities[action.payload.email]
      if (userInvite) {
        userInvite.id = action.payload.id
      }
    },
    inviteConfirmed(state, action: PayloadAction<{email: string}>) {
      userInvitesAdapter.removeOne(state, action.payload.email)
    },
    inviteCancelled(state, action: PayloadAction<{email: string}>) {
      userInvitesAdapter.removeOne(state, action.payload.email)
    }
  }
})

export default userInvitesSlice.reducer


// actions
export const {
  userInvited,
  inviteAccepted,
  inviteConfirmed,
  inviteCancelled
} = userInvitesSlice.actions


// selectors
export const {
  selectAll: selectUserInvites,
  selectById: selectUserInviteByEmail,
} = userInvitesAdapter.getSelectors<RootState>(state => state.userInvites)

