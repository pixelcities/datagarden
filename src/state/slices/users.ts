import { createSelector, createAction, createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { User } from 'types'

const usersAdapter = createEntityAdapter<User>()
const initialState = usersAdapter.getInitialState()

// reducers
const usersSlice = createSlice({
  name: 'users',
  initialState: initialState,
  reducers: {
    userCreated: usersAdapter.addOne,
    userUpdated: usersAdapter.upsertOne,
    userActivitySet(state, action: PayloadAction<{id: string, last_active_at: string}>) {
      const user = state.entities[action.payload.id]
      if (user) {
        user.last_active_at = action.payload.last_active_at
      }
    },
    userDeleted(state, action: PayloadAction<{id: string}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default usersSlice.reducer


// actions
export const {
  userCreated,
  userUpdated,
  userDeleted
} = usersSlice.actions

export const login = createAction('users/login', (action) => {
  return {
    payload: {
      id: action.id,
      name: action.name,
      email: action.email,
      picture: action.picture,
      relation: "self"
    }
  }
})


// selectors
export const {
  selectAll: selectUsers,
  selectById: selectUserById,
} = usersAdapter.getSelectors<RootState>(state => state.users)

export const selectUserByEmail = createSelector(
  selectUsers,
  (_: RootState, email: string) => email,
  (users, email) => users.find(user => user.email === email)
)

export const selectSelf = createSelector(
  selectUsers,
  users => users.find(user => user.relation === "self")
)

