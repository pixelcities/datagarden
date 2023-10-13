import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'
import ColorPicker from 'components/ColorPicker'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderBar } from 'utils/charts'

interface BarSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings,
  isPublished: boolean
}

const BarSettings: FC<BarSettingsProps> = ({ id, columnNames, settings, isPublished }) => {
  const dispatch = useAppDispatch()

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

  const handleDispatch = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: key,
      value: e.target.value
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

  const handleSort = (sort: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: "sort",
      value: sort
    }))
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Group column</label>
        </div>

        <Dropdown
          items={Object.values(columnNames)}
          onClick={e => handleColumn("nameColumnId", e)}
          selected={columnNames[settings.nameColumnId]}
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

        <input type="text" className="input" value={settings.xLabel || ""} onChange={e => handleDispatch(e, "xLabel")} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Y Label</label>
        </div>

        <input type="text" className="input" value={settings.yLabel || ""} onChange={e => handleDispatch(e, "yLabel")} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Y Format</label>
        </div>

        <input type="text" className="input" value={settings.yFormat || ""} onChange={e => handleDispatch(e, "yFormat")} disabled={isPublished} />
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

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Sort</label>
        </div>

        <Dropdown
          items={["None", "Ascending", "Descending"]}
          onClick={handleSort}
          selected={settings.sort}
          isDisabled={isPublished}
        />
      </>

    </>
  )
}


interface BarProps {
  id: string,
  collectionId: string,
  nameColumnId: string,
  valueColumnId: string,
  xLabel: string,
  yLabel: string,
  yFormat: string,
  color: string,
  sort: string,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Bar: FC<BarProps> = ({ id, collectionId, nameColumnId, valueColumnId, xLabel, yLabel, yFormat, color, sort, getContentCallback }) => {
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
      const svg = renderBar(data, nameColumnId, valueColumnId, xLabel, yLabel, yFormat, color, sort)
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
  }, [ data, nameColumnId, valueColumnId, xLabel, yLabel, yFormat, color, sort, getContentCallback ])

  return (
    <div ref={ref} style={{width: "100%", height: "100%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default Bar
export {
  BarSettings
}
