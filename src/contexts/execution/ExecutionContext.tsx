import React, { useEffect, useCallback, FC } from "react";
import { EnhancedStore } from '@reduxjs/toolkit'

import { RootState } from 'state/store'
import { Task } from 'types'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectTasks, selectActiveDataSpace } from 'state/selectors'
import { completeTask } from 'state/actions'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useDataFusionContext } from 'contexts'

import { handleTask as handleProtocolTask } from './protocol'
import { handleTask as handleTransformerTask } from './transformer'


interface ExecutionProviderI {
  store: EnhancedStore<RootState>
}

export const ExecutionProvider: FC<ExecutionProviderI> = ({ store, children }) => {
  const dispatch = useAppDispatch()

  const { user } = useAuthContext();
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()
  const { arrow, dataFusion } = useDataFusionContext()

  const tasks = useAppSelector(selectTasks)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const taskDispatcher = useCallback((task: Task) => {
    const onComplete = (actions: any[]) => {
      actions.forEach(action => dispatch(action))

      dispatch(completeTask({
        id: task.id,
        fragments: task.fragments,
        is_completed: true
      }))
    }

    if (task.type === "protocol") {
      handleProtocolTask(task, protocol, onComplete)

    } else if (task.type === "transformer" && user) {
      handleTransformerTask(task, user, dataSpace, store, keyStore, protocol, arrow, dataFusion, onComplete)

    } else {
      console.log("Received unexpected task type: ", task.type)
    }
  }, [ user, dataSpace, store, keyStore, protocol, arrow, dataFusion, dispatch ])

  useEffect(() => {
    if (keyStoreIsReady) {

      console.log("About to execute task, maybe:", tasks.length, !!dataSpace)

      // Just handle one at a time for now
      if (tasks.length >= 1 && !!dataSpace) {
        const task = tasks[0]

        // When this task is completed, it will update the tasks selector
        // and retrigger the effect until all tasks are completed.
        taskDispatcher(task)
      }
    }
  }, [ keyStoreIsReady, tasks, taskDispatcher, dataSpace ])

  return (
    <>
      { children }
    </>
  )
}

