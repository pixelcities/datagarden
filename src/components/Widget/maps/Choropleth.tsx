import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderChoropleth, ColorRamp, MapClassification } from 'utils/maps'


type MapClassificationKey = keyof typeof MapClassification
type ColorRampKey = keyof typeof ColorRamp

interface ChoroplethSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings,
  isPublished: boolean
}

const ChoroplethSettings: FC<ChoroplethSettingsProps> = ({ id, columnNames, settings, isPublished }) => {
  const dispatch = useAppDispatch()
  const columns: [string, string][] = useMemo(() => Object.entries(columnNames).map(([id, name]) => [id, name]), [ columnNames ])

  const [title, setTitle] = useState(settings.legendTitle)
  const [valueFormat, setValueFormat] = useState(settings.valueFormat)

  const handleDropdown = (key: string, item: [string, any]) => {
    if (item[0] !== settings[key]) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: key,
        value: item[0]
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

  const handleDispatch = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: key,
      value: e.target.value
    }))
  }

  const resetMap = () => {
    dispatch(putWidgetSetting({
      id: id,
      workspace: "default",
      key: "transform",
      value: '{"k":1,"x":0,"y":0}'
    }))
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Classification</label>
        </div>

        <Dropdown<[string, MapClassification]>
          items={Object.entries(MapClassification)}
          onClick={e => handleDropdown("classification", e)}
          selected={[settings.classification, MapClassification[(settings.classification as MapClassificationKey)]]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Number of Classes</label>
        </div>

        <input type="number" min="3" max="9" className="input" value={settings.nrClasses || "5"} onChange={e => handleDispatch(e, "nrClasses")} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Name column</label>
        </div>

        <Dropdown
          items={columns}
          onClick={e => handleDropdown("nameColumnId", e)}
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
          onClick={e => handleDropdown("valueColumnId", e)}
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
          onClick={e => handleDropdown("geomColumnId", e)}
          selected={[settings.geomColumnId, columnNames[settings.geomColumnId]]}
          isDisabled={isPublished}
        />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Reset Map</label>
        </div>

        <button className="button is-info" onClick={resetMap} disabled={isPublished}> Reset </button>
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Legend Title</label>
        </div>

        <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} onBlur={() => handleText("legendTitle", title)} onKeyDown={(e) => e.keyCode === 13 && handleText("legendTitle", title)} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Value Format</label>
        </div>

        <input type="text" className="input" value={valueFormat} onChange={e => setValueFormat(e.target.value)} onBlur={() => handleText("valueFormat", valueFormat)} onKeyDown={(e) => e.keyCode === 13 && handleText("valueFormat", valueFormat)} disabled={isPublished} />
      </>

      <>
        <div className="field pb-0 pt-5">
          <label className="label">Color Ramp</label>
        </div>

        <Dropdown<[string, ColorRamp]>
          items={Object.entries(ColorRamp)}
          onClick={e => handleDropdown("colorRamp", e)}
          selected={[settings.colorRamp, ColorRamp[(settings.colorRamp as ColorRampKey)]]}
          isDisabled={isPublished}
        />
      </>

    </>
  )
}


interface ChoroplethProps {
  id: string,
  collectionId: string,
  classification: string,
  nrClasses: number,
  nameColumnId: string,
  valueColumnId: string,
  geomColumnId: string,
  legendTitle: string,
  valueFormat: string,
  colorRamp: string,
  transform: string,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Choropleth: FC<ChoroplethProps> = ({ id, collectionId, classification, nrClasses, nameColumnId, valueColumnId, geomColumnId, legendTitle, valueFormat, colorRamp, transform, getContentCallback }) => {
  const dispatch = useAppDispatch()

  const ref = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({height: 0, width: 0})

  const { dataFusion } = useDataFusionContext()

  const newTransform = useRef("")
  const lastTransform = useRef("")
  const lastUpdate = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() / 1000

      if (newTransform.current !== "" && newTransform.current !== lastTransform.current) {
        if (lastUpdate.current !== 0 && now - lastUpdate.current > 3) {
          dispatch(putWidgetSetting({
            id: id,
            workspace: "default",
            key: "transform",
            value: newTransform.current
          }))

          lastTransform.current = newTransform.current
        }
      }
    }, 1000)

    return () => {
      clearInterval(interval)

      // Force update on close
      if (newTransform.current !== "" && newTransform.current !== lastTransform.current) {
        dispatch(putWidgetSetting({
          id: id,
          workspace: "default",
          key: "transform",
          value: newTransform.current
        }))
      }
    }
  }, [ id, dispatch ])

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
      const setTransform = (transform: string) => {
        if (transform !== newTransform.current) {
          newTransform.current = transform
          lastUpdate.current = Date.now() / 1000
        }
      }

      const svg = renderChoropleth(data, classification, nrClasses, nameColumnId, valueColumnId, geomColumnId, legendTitle, valueFormat, colorRamp, transform, setTransform)
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
  }, [ data, classification, nrClasses, nameColumnId, valueColumnId, geomColumnId, legendTitle, valueFormat, colorRamp, transform, getContentCallback ])

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
