import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderHistogram } from 'utils/charts'

interface HistogramSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings
}

const HistogramSettings: FC<HistogramSettingsProps> = ({ id, columnNames, settings }) => {
  const dispatch = useAppDispatch()

  const handleColumn = (item: string) => {
    const columnId = Object.keys(columnNames).find(id => columnNames[id] === item)

    if (columnId && columnId !== settings.column) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: "column",
        value: columnId
      }))
    }
  }

  const handleDispatch = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: key,
      value: e.target.value
    }))
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Column</label>
        </div>

        <Dropdown
          items={Object.values(columnNames)}
          onClick={handleColumn}
          selected={columnNames[settings.column]}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">X Label</label>
        </div>

        <input type="text" className="input" value={settings.xLabel || ""} onChange={e => handleDispatch(e, "xLabel")} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Y Label</label>
        </div>

        <input type="text" className="input" value={settings.yLabel || ""} onChange={e => handleDispatch(e, "yLabel")} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Bins</label>
        </div>

        <input type="number" className="input" value={settings.nrBins || 5} onChange={e => handleDispatch(e, "nrBins")} />
      </>
    </>
  )
}


interface HistogramProps {
  id: string,
  collectionId: string,
  columnId: string,
  xLabel: string,
  yLabel: string,
  nrBins: number,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Histogram: FC<HistogramProps> = ({ id, collectionId, columnId, xLabel, yLabel, nrBins, getContentCallback }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({height: 0, width: 0})

  const { dataFusion } = useDataFusionContext()

  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setDimensions({
        height: rect.height,
        width: rect.width
      })
    }
  }, [ ref, setDimensions ]);

  const data = useMemo(() => {
    const nrRows = dataFusion?.nr_rows(collectionId)

    let data = []
    for (let i = 0; i < nrRows; i++) {
      data.push(dataFusion?.get_row(collectionId, i))
    }

    return data
  }, [ collectionId, dataFusion ])

  useEffect(() => {
    const node = document.getElementById("canvas")

    if (data && node) {
      const svg = renderHistogram(data, columnId, xLabel, yLabel, nrBins)
      node.append(svg)

      // Callback
      if (getContentCallback) {
        getContentCallback(() => {
          return {
            content: node.innerHTML,
            height: node.clientHeight
          }
        })
      }

      return () => {
        svg.remove()
      }
    }
  }, [ data, columnId, xLabel, yLabel, nrBins, getContentCallback ])

  return (
    <div ref={ref} style={{width: "100%", height: "100%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default Histogram
export {
  HistogramSettings
}
