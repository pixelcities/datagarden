import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderChoropleth } from 'utils/maps'

interface ChoroplethSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings,
  isPublished: boolean
}

const ChoroplethSettings: FC<ChoroplethSettingsProps> = ({ id, columnNames, settings, isPublished }) => {
  const dispatch = useAppDispatch()
  const columns: [string, string][] = useMemo(() => Object.entries(columnNames).map(([id, name]) => [id, name]), [ columnNames ])

  const handleColumn = (key: string, item: [string, string]) => {
    if (item[0] !== settings[key]) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: key,
        value: item[0]
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

  const handleColorChange = (value: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: "colorRamp",
      value: value
    }))
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Name column</label>
        </div>

        <Dropdown
          items={columns}
          onClick={e => handleColumn("nameColumnId", e)}
          selected={[settings.nameColumnId, columnNames[settings.nameColumnId]]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Value Column</label>
        </div>

        <Dropdown
          items={columns}
          onClick={e => handleColumn("valueColumnId", e)}
          selected={[settings.valueColumnId, columnNames[settings.valueColumnId]]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Geometry Column</label>
        </div>

        <Dropdown
          items={columns}
          onClick={e => handleColumn("geomColumnId", e)}
          selected={[settings.geomColumnId, columnNames[settings.geomColumnId]]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Value Format</label>
        </div>

        <input type="text" className="input" value={settings.valueFormat || ""} onChange={e => handleDispatch(e, "valueFormat")} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Color Ramp</label>
        </div>

        <Dropdown
          items={["Blues"]}
          onClick={handleColorChange}
          selected={settings.colorRamp}
          isDisabled={isPublished}
        />
      </>

    </>
  )
}


interface ChoroplethProps {
  id: string,
  collectionId: string,
  nameColumnId: string,
  valueColumnId: string,
  geomColumnId: string,
  valueFormat: string,
  colorRamp: string,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Choropleth: FC<ChoroplethProps> = ({ id, collectionId, nameColumnId, valueColumnId, geomColumnId, valueFormat, colorRamp, getContentCallback }) => {
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
      const svg = renderChoropleth(data, nameColumnId, valueColumnId, geomColumnId, valueFormat, colorRamp)
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
  }, [ data, nameColumnId, valueColumnId, geomColumnId, valueFormat, colorRamp, getContentCallback ])

  return (
    <div ref={ref} style={{width: "100%", height: "100%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default Choropleth
export {
  ChoroplethSettings
}
