import React, { useEffect, useMemo, useRef, useCallback, FC } from "react";
import { EnhancedStore } from '@reduxjs/toolkit'
import { Mutex } from 'async-mutex'
import { RootState } from 'state/store'
import { ExecutionError } from 'types'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectTasks, selectActiveDataSpace } from 'state/selectors'
import { completeTask, failTask, deleteLocalTask } from 'state/actions'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useDataFusionContext } from 'contexts'

import { handleTask as handleProtocolTask } from './protocol'
import { handleTask as handleTransformerTask } from './transformer'
import { handleTask as handleWidgetTask } from './widget'


const TASK_TTL_BUFFER = 60000

interface ExecutionProviderI {
  store: EnhancedStore<RootState>
}

export const ExecutionProvider: FC<ExecutionProviderI> = ({ store, children }) => {
  const dispatch = useAppDispatch()
  const mutex = useMemo(() => new Mutex(), [])

  const { user } = useAuthContext();
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()
  const { arrow, dataFusion } = useDataFusionContext()

  const tasks = useAppSelector(selectTasks)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const taskCache = useRef<any>(new Set())
  const taskRetries = useRef<{[key: string]: number}>({})

  const taskDispatcher = useCallback(() => {
    if (keyStoreIsReady && user) {
      // Filter out any previously completed tasks, in case we raced the event roundtrip
      const newTasks = tasks.filter(t => !taskCache.current.has(t.id))

      if (newTasks.length >= 1 && !!dataSpace) {
        const task = newTasks[0]

        // Verify that this task is not nearing the task deadline
        if (task.expires_at && task.expires_at > Date.now() + TASK_TTL_BUFFER) {
          mutex.runExclusive(async () => {
            if (taskCache.current.has(task.id)) {
              return
            }

            const result = (() => {
              if (task.type === "protocol") {
                return handleProtocolTask(task, protocol)

              } else if (task.type === "widget") {
                return handleWidgetTask(task, user, dataSpace, store, keyStore, arrow, dataFusion)

              } else { // "transformer"
                return handleTransformerTask(task, user, dataSpace, store, keyStore, protocol, arrow, dataFusion)
              }
            })

            return result()
              .then(({actions, metadata}) => {
                actions.forEach(action => dispatch(action))

                taskCache.current.add(task.id)
                dispatch(completeTask({
                  id: task.id,
                  fragments: task.fragments,
                  metadata: metadata,
                  is_completed: true
                }))
              })
              .catch((e: unknown) => {
                let error, message

                // Expected error
                if (Array.isArray(e)) {
                  [error, message] = (e as [ExecutionError, string])

                // But perhaps something unexpected threw an error?
                } else if (e instanceof Error) {
                  error = ExecutionError.Failure
                  message = e.message
                }

                // Failed with a retry request, we will retry up to 3 times
                if (error === ExecutionError.Retry) {
                  if (task.id in taskRetries.current) {
                    const errorCount = taskRetries.current[task.id]

                    if (errorCount < 3) {
                      taskRetries.current[task.id] = errorCount + 1
                    } else {
                      taskCache.current.add(task.id)
                      delete taskRetries.current[task.id]
                      dispatch(failTask({
                        id: task.id,
                        error: message || "Too many failures"
                      }))
                    }

                  } else { // First retry
                    taskRetries.current[task.id] = 0
                  }

                } else {
                  taskCache.current.add(task.id)
                  dispatch(failTask({
                    id: task.id,
                    error: message || "Unknown error"
                  }))
                }
              })
          })

        } else { // Task expired
          dispatch(deleteLocalTask(task.id))
        }
      }
    }
  }, [ user, tasks, taskCache, dataSpace, store, keyStore, keyStoreIsReady, protocol, arrow, dataFusion, dispatch, mutex ])

  useEffect(() => {
    taskDispatcher()
  }, [ tasks, taskDispatcher ])

  useEffect(() => {
    const interval = setInterval(taskDispatcher, 10000)

    return () => clearInterval(interval)
  }, [ taskDispatcher ])

  return (
    <>
      { children }
    </>
  )
}

