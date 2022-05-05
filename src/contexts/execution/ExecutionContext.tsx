import React, { useEffect, useCallback, FC } from "react";

import { Task } from 'types'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectTasks } from 'state/selectors'
import { completeTask } from 'state/actions'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useDataFusionContext } from 'contexts'

import { handleTask as handleProtocolTask } from './protocol'
import { handleTask as handleTransformerTask } from './transformer'


export const ExecutionProvider: FC = ({ children }) => {
  const dispatch = useAppDispatch()

  const { user } = useAuthContext();
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()
  const { arrow, dataFusion } = useDataFusionContext()

  const tasks = useAppSelector(selectTasks)

  const taskDispatcher = useCallback((task: Task) => {
    const onComplete = () => {
      dispatch(completeTask({
        id: task.id,
        is_complete: true
      }))
    }

    if (task.type === "protocol") {
      handleProtocolTask(task, protocol, onComplete)

    } else if (task.type === "transformer") {
      handleTransformerTask(task, keyStore, arrow, dataFusion, onComplete)

    } else {
      console.log("Received unexpected task type: ", task.type)
    }
  }, [ keyStore, protocol, arrow, dataFusion, dispatch ])

  useEffect(() => {
    if (keyStoreIsReady) {

      // Just handle one at a time for now
      if (tasks.length >= 1) {
        const task = tasks[0]

        // When this task is completed, it will update the tasks selector
        // and retrigger the effect until all tasks are completed.
        taskDispatcher(task)
      }
    }
  }, [ keyStoreIsReady, tasks, taskDispatcher ])

  return (
    <>
      { children }
    </>
  )
}

