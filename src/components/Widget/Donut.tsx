import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import Dropdown from 'components/Dropdown'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'
import { renderDonut } from 'utils/charts'


interface DonutSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings,
  isPublished: boolean
}

const DonutSettings: FC<DonutSettingsProps> = ({ id, columnNames, settings, isPublished }) => {
  const dispatch = useAppDispatch()

  const handleColumn = (key: string, item: string) => {
    const columnId = Object.keys(columnNames).find(id => columnNames[id] === item)

    if (columnId && columnId !== settings.column) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: key,
        value: columnId
      }))
    }
  }

  return (
    <>
      <>
        <div className="field pb-0 pt-5">
          <label className="label">Name Column</label>
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
    </>
  )
}


interface DonutProps {
  id: string,
  collectionId: string,
  nameColumnId: string,
  valueColumnId: string,
  getContentCallback?: (cb: () => {content: string | undefined, height: number | undefined}) => void
}

const Donut: FC<DonutProps> = ({ id, collectionId, nameColumnId, valueColumnId, getContentCallback }) => {
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
      const svg = renderDonut(data, nameColumnId, valueColumnId)

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
  }, [ data, nameColumnId, valueColumnId, getContentCallback ])

  return (
    <div ref={ref} className="pt-6" style={{width: "100%", height: "90%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default Donut
export {
  DonutSettings
}
