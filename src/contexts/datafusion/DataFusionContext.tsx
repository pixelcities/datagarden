import React, { useState, useEffect, useContext, FC } from "react"

interface DataFusionContextI {
  arrow?: any
  dataFusion?: any
  loadArrow: () => void
  loadDataFusion: () => void
}

const DataFusionContext = React.createContext<DataFusionContextI>({loadArrow: () => {}, loadDataFusion: () => {}})

export const DataFusionProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false)

  const [arrow, setArrow] = useState<any>(null)
  const [dataFusion,setDataFusion]=useState<any>(null)

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
    let isCancelled = false

    const init = async () => {
      // Load all the heavy wasm stuff
      const { DataFusion } = await import("@pixelcities/datafusion-wasm")
      const { Arrow } = await import("@pixelcities/arrow-wasm")

      const _arrow = await Arrow()
      const _datafusion = new DataFusion()

      if (!isCancelled) {
        setArrow(_arrow)
        setDataFusion(_datafusion)

        // Ready
        setLoading(false)
      }
    }

    init()

    return () => { isCancelled = true }
  },[])

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

