import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { MPC } from 'types'

const mpcAdapter = createEntityAdapter<MPC>()
const initialState = mpcAdapter.getInitialState()

// reducers
const mpcSlice = createSlice({
  name: 'mpc',
  initialState: initialState,
  reducers: {
    mpcCreated: mpcAdapter.addOne,
    mpcPartialShared(state, action: PayloadAction<{id: string, value: number}>) {
      const mpc = state.entities[action.payload.id]
      if (mpc) {
        mpc.value = action.payload.value
      }
    },
    mpcResultShared(state, action: PayloadAction<{id: string, value: number}>) {
      const mpc = state.entities[action.payload.id]
      if (mpc) {
        mpc.value = action.payload.value
      }
    }
  }
})

export default mpcSlice.reducer


// actions
export const {
  mpcCreated,
  mpcPartialShared,
  mpcResultShared
} = mpcSlice.actions


// selectors
export const {
  selectAll: selectMPCs,
  selectById: selectMPCbyId
} = mpcAdapter.getSelectors<RootState>(state => state.mpc)

