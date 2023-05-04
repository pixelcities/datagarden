import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'
import ColorPicker from 'components/ColorPicker'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderArea } from 'utils/charts'

interface AreaSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings,
  isPublished: boolean
}

const AreaSettings: FC<AreaSettingsProps> = ({ id, columnNames, settings, isPublished }) => {
  const dispatch = useAppDispatch()

  const [xLabel, setXLabel] = useState(settings.xLabel)
  const [yLabel, setYLabel] = useState(settings.yLabel)

  const handleColumn = (key: string, item: string) => {
    const columnId = Object.keys(columnNames).find(id => columnNames[id] === item)

    if (columnId && columnId !== settings[key]) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: key,
        value: columnId
      }))
    }
  }

  const handleText = (key: string, value: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: key,
      value: value
    }))
  }

  const handleColorChange = (color: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: "color",
      value: color
    }))
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Time column</label>
        </div>

        <Dropdown
          items={Object.values(columnNames)}
          onClick={e => handleColumn("timeColumnId", e)}
          selected={columnNames[settings.timeColumnId]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Value Column</label>
        </div>

        <Dropdown
          items={Object.values(columnNames)}
          onClick={e => handleColumn("valueColumnId", e)}
          selected={columnNames[settings.valueColumnId]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">X Label</label>
        </div>

        <input type="text" className="input" value={xLabel} onChange={e => setXLabel(e.target.value)} onBlur={() => handleText("xLabel", xLabel)} onKeyDown={(e) => e.keyCode === 13 && handleText("xLabel", xLabel)} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Y Label</label>
        </div>

        <input type="text" className="input" value={yLabel} onChange={e => setYLabel(e.target.value)} onBlur={() => handleText("yLabel", yLabel)} onKeyDown={(e) => e.keyCode === 13 && handleText("yLabel", yLabel)} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Color</label>

          <ColorPicker
            color={settings.color || "#3457A6"}
            onClick={handleColorChange}
            isDisabled={isPublished}
          />
        </div>
      </>

    </>
  )
}


interface AreaProps {
  id: string,
  collectionId: string,
  timeColumnId: string,
  valueColumnId: string,
  xLabel: string,
  yLabel: string,
  color: string,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Area: FC<AreaProps> = ({ id, collectionId, timeColumnId, valueColumnId, xLabel, yLabel, color, getContentCallback }) => {
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
      const svg = renderArea(data, timeColumnId, valueColumnId, xLabel, yLabel, color)
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
  }, [ data, timeColumnId, valueColumnId, xLabel, yLabel, color, getContentCallback ])

  return (
    <div ref={ref} style={{width: "100%", height: "100%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default Area
export {
  AreaSettings
}
