import React, { useEffect, useMemo, useCallback, FC } from "react";
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

  const taskDispatcher = useCallback(() => {
    if (keyStoreIsReady && user) {
      if (tasks.length >= 1 && !!dataSpace) {
        const task = tasks[0]

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
  }, [ user, tasks, dataSpace, store, keyStore, keyStoreIsReady, protocol, arrow, dataFusion, dispatch, mutex ])

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

