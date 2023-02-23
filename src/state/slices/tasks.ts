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
    deleteLocalTask: tasksAdapter.removeOne,
    taskAssigned(state, action: PayloadAction<Task>) {
      // Add a deadline to this task based on the given ttl. If we for some reason end up attempting to execute
      // this task when the deadline is crossed we ignore it instead because the server won't accept it anyways.
      const assigned_at = action.payload.date ? Date.parse(action.payload.date.split("Z").length > 1 ? action.payload.date : action.payload.date + "Z"): Date.now()
      const expires_at = assigned_at + ((action.payload.ttl || 300) * 1000)

      const payload = {...action.payload, expires_at: expires_at}

      tasksAdapter.upsertOne(state, payload)
    },
    taskCompleted(state, action: PayloadAction<{id: string, fragments: string[], metadata: {[key: string]: any}, is_completed: boolean}>) {
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
  taskCompleted,
  deleteLocalTask
} = tasksSlice.actions


// selectors
export const {
  selectAll: selectTasks
} = tasksAdapter.getSelectors<RootState>(state => state.tasks)

