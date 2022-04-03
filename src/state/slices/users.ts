import { createSelector, createAction, createSlice, createEntityAdapter } from '@reduxjs/toolkit'
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
    userUpdated: usersAdapter.upsertOne
  }
})

export default usersSlice.reducer


// actions
export const {
  userCreated,
  userUpdated
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

