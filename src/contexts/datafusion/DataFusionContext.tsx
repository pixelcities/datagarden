import React, { useState, useEffect, useContext, FC } from "react"

import { useAuthContext } from 'contexts'

import init, { DataFusion} from '@pixelcities/datafusion-wasm'
import type { DataFusion as DataFusionT } from '@pixelcities/datafusion-wasm'


interface DataFusionContextI {
  arrow?: any
  dataFusion?: any
  loadArrow: () => void
  loadDataFusion: () => void
}

const DataFusionContext = React.createContext<DataFusionContextI>({loadArrow: () => {}, loadDataFusion: () => {}})

export const DataFusionProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { isAuthenticated } = useAuthContext()

  const [arrow, setArrow] = useState<any>()
  const [dataFusion,setDataFusion]=useState<DataFusionT | undefined>()

  // Components that wish to use this context can call these load functions within a useEffect to
  // ensure that all the wasm has loaded. It rarely happens that the first page requires datafusion
  // but it is not impossible. By toggling the loading state, the pageloader will overlay
  // whatever child component wanted to render, without the child having to await anything.
  const loadArrow = () => {
    if (! arrow) {
      setLoading(true)
    }
  }

  const loadDataFusion = () => {
    if (! dataFusion) {
      setLoading(true)
    }
  }

  useEffect(()=> {
    if (isAuthenticated) {
      let isCancelled = false

      const loadWasm = async () => {
        // Load all the heavy wasm stuff
        const { Arrow } = await import("@pixelcities/arrow-wasm")
        await init()

        const _arrow = await Arrow()
        const _datafusion = new DataFusion()

        if (!isCancelled) {
          setArrow(_arrow)
          setDataFusion(_datafusion)

          // Ready
          setLoading(false)
        }
      }

      loadWasm()

      return () => { isCancelled = true }
    }
  }, [ isAuthenticated ])

  return (
    <DataFusionContext.Provider value={{arrow, dataFusion, loadArrow, loadDataFusion}} >
      <div className={"pageloader is-bottom-to-top" + (loading ? " is-active" : "")}>
        <span className="title">
          Loading...
        </span>
      </div>

      { children }
    </DataFusionContext.Provider>
  )
}

export const useDataFusionContext = () =>  useContext(DataFusionContext)

