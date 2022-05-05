import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
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
    taskCompleted: tasksAdapter.removeOne
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

