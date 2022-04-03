import React, { useState, useEffect, useContext, FC } from "react";

import ProgressBar from 'components/ProgressBar'

interface DataFusionContextI {
  arrow?: any
  dataFusion?: any
  loadArrow: () => void
  loadDataFusion: () => void
}

const DataFusionContext = React.createContext<DataFusionContextI>({loadArrow: () => {}, loadDataFusion: () => {}});

export const DataFusionProvider: FC = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [progressResolve, setProgressResolve] = useState<(() => void) | undefined>(undefined);

  const [arrow, setArrow] = useState<any>(null);
  const [dataFusion,setDataFusion]=useState<any>(null);

  const init = async () => {
    // Allow the progress bar to resolve our promise so that we can wait with setting loading to false
    const progressBarComplete = new Promise(resolve => setProgressResolve(() => resolve));

    // Load all the heavy wasm stuff and give some progress updates
    const { DataFusion } = await import("datafusion-wasm"); setLoadProgress(.33);
    const { Arrow } = await import("arrow-wasm"); setLoadProgress(.66);

    const _arrow = await Arrow(); setLoadProgress(1);
    const _datafusion = new DataFusion();

    setArrow(_arrow);
    setDataFusion(_datafusion);

    // Ready
    await progressBarComplete;
    setLoading(false)
  }

  // Components that wish to use this context can call these load functions within a useEffect to
  // ensure that all the wasm has loaded. It rarely happens that the first page requires wasm
  // but it is not impossible. By toggling the loading state, the progress bar will override
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
    init();
  },[])

  return (
    <DataFusionContext.Provider value={{arrow, dataFusion, loadArrow, loadDataFusion}} >
      { loading ? (<ProgressBar duration={1000} progress={loadProgress} resolve={progressResolve} />) : children }
    </DataFusionContext.Provider>
  )
}

export const useDataFusionContext = () =>  useContext(DataFusionContext);

