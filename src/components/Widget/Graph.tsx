import React, { FC, useMemo } from 'react';
import Dropdown from 'components/Dropdown'
import Histogram, { HistogramSettings } from './Histogram'
import Donut, { DonutSettings } from './Donut'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { Schema, WidgetSettings } from 'types'

import './Widget.sass'


interface GraphProps {
  id: string,
  collectionId: string,
  columnNames: {[key: string]: string},
  schema: Schema,
  settings: WidgetSettings
}

const Graph: FC<GraphProps> = ({ id, collectionId, columnNames, schema, settings }) => {
  const dispatch = useAppDispatch()

  const handleGraphType = (item: string) => {
    if (item !== settings.type) {
      dispatch(putWidgetSetting({
        id: id,
        workspace: "default",
        key: "type",
        value: item
      }))
    }
  }

  const renderGraph = useMemo(() => {
    if (settings.type === "Histogram") {
      return (
        <Histogram
          id={id}
          collectionId={collectionId}
          columnId={settings.column}
          xLabel={settings.xLabel}
          yLabel={settings.yLabel}
          nrBins={parseInt(settings.nrBins)}
        />
      )
    } else if (settings.type === "Donut") {
      return (
        <Donut
          id={id}
          collectionId={collectionId}
          nameColumnId={settings.nameColumnId}
          valueColumnId={settings.valueColumnId}
        />
      )
    }

  }, [ id, collectionId, settings ])

  const renderGraphSettings = useMemo(() => {
    if (settings.type === "Histogram") {
      return (
        <HistogramSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
        />
      )
    } else if (settings.type === "Donut") {
      return (
        <DonutSettings
          id={id}
          columnNames={columnNames}
          settings={settings}
        />
      )
    }

  }, [ id, columnNames, settings ])

  return (
    <>
      <div className="graph-container">
        { renderGraph }
      </div>

      <div className="widget-control-container">
        <div className="is-relative px-4 py-4">
          <div className="field pb-0">
            <label className="label">Type</label>
          </div>

          <Dropdown
            items={["Histogram", "Donut"]}
            onClick={handleGraphType}
            selected={settings.type}
          />

          { renderGraphSettings }
        </div>
      </div>
    </>
  )
}

export default Graph
