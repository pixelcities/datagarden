import React, { useRef, useEffect, useCallback, FC } from "react";

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

  const taskCache = useRef<any>(new Set())
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
  }, [ keyStore, protocol, arrow, dataFusion ])

  useEffect(() => {
    if (keyStoreIsReady) {
      tasks.forEach(task => {
        if (! taskCache.current.has(task.id)) {
          taskCache.current.add(task.id)
          taskDispatcher(task)
        }
      })
    }
  }, [ keyStoreIsReady, taskCache, tasks, taskDispatcher ])

  return (
    <>
      { children }
    </>
  )
}

