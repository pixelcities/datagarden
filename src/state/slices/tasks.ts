import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'state/store'
import { Task } from 'types'

const tasksAdapter = createEntityAdapter<Task>()
const initialState = tasksAdapter.getInitialState()

// reducers
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: initialState,
  reducers: {
    taskAssigned: tasksAdapter.upsertOne,
    taskCompleted(state, action: PayloadAction<{id: string, is_complete: boolean}>) {
      const ids = state.ids.filter(id => id !== action.payload.id)

      state.ids = ids
      delete state.entities[action.payload.id]
    }
  }
})

export default tasksSlice.reducer


// actions
export const {
  taskAssigned,
  taskCompleted
} = tasksSlice.actions


// selectors
export const {
  selectAll: selectTasks
} = tasksAdapter.getSelectors<RootState>(state => state.tasks)

