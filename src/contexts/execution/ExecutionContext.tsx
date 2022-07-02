import React, { useEffect, useMemo, useRef, useCallback, FC } from "react";
import { EnhancedStore } from '@reduxjs/toolkit'
import { Mutex } from 'async-mutex'
import { RootState } from 'state/store'
import { ExecutionError } from 'types'
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
  const mutex = useMemo(() => new Mutex(), [])

  const { user } = useAuthContext();
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()
  const { arrow, dataFusion } = useDataFusionContext()

  const tasks = useAppSelector(selectTasks)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const taskCache = useRef<any>(new Set())
  const taskDispatcher = useCallback(() => {
    if (keyStoreIsReady && user) {

      // Filter out any previously completed tasks, in case we raced the event roundtrip
      const newTasks = tasks.filter(t => !taskCache.current.has(t.id))

      if (newTasks.length >= 1 && !!dataSpace) {
        const task = newTasks[0]

        mutex.runExclusive(async () => {
          const result = (() => {
            if (task.type === "protocol") {
              return handleProtocolTask(task, protocol)

            } else { // "transformer"
              return handleTransformerTask(task, user, dataSpace, store, keyStore, protocol, arrow, dataFusion)
            }
          })

          result()
            .then((actions: any[]) => {
              actions.forEach(action => dispatch(action))

              taskCache.current.add(task.id)
              dispatch(completeTask({
                id: task.id,
                fragments: task.fragments,
                is_completed: true
              }))
            })
            .catch((e: ExecutionError) => {
              console.log(e)
            })
        })
      }
    }
  }, [ user, tasks, taskCache, dataSpace, store, keyStore, keyStoreIsReady, protocol, arrow, dataFusion, dispatch, mutex ])

  useEffect(() => {
    const interval = setInterval(taskDispatcher, 10000)

    return () => clearInterval(interval)
  }, [taskDispatcher])

  return (
    <>
      { children }
    </>
  )
}

