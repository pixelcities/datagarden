import React, { useRef, useEffect, FC } from "react";

import { useAppSelector } from 'hooks'
import { selectTasks } from 'state/selectors'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


export const ExecutionProvider: FC = ({ children }) => {
  const { user } = useAuthContext();
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()

  const taskCache = useRef<any>(new Set())
  const tasks = useAppSelector(selectTasks)

  useEffect(() => {
    if (keyStoreIsReady) {
      tasks.forEach(task => {
        if (! taskCache.current.has(task.id)) {
          console.log("Received a task: ", task.id)
          taskCache.current.add(task.id)
        }
      })
    }
  }, [ keyStoreIsReady, taskCache, tasks ])

  return (
    <>
      { children }
    </>
  )
}

