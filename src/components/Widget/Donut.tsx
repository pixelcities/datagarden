import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import * as d3 from 'd3'
import Dropdown from 'components/Dropdown'

import { useAppDispatch } from 'hooks'
import { putWidgetSetting } from 'state/actions'
import { WidgetSettings } from 'types'

import { useDataFusionContext } from 'contexts'


interface DonutSettingsProps {
  id: string,
  columnNames: {[key: string]: string},
  settings: WidgetSettings
}

const DonutSettings: FC<DonutSettingsProps> = ({ id, columnNames, settings }) => {
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
        />
      </>
    </>
  )
}


interface DonutProps {
  id: string,
  collectionId: string,
  nameColumnId: string,
  valueColumnId: string
}

const Donut: FC<DonutProps> = ({ id, collectionId, nameColumnId, valueColumnId }) => {
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
    const margin = { top: 0, right: 25, bottom: 25, left: 25 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    // Constants
    const innerRadius = Math.min(width, height) / 3
    const outerRadius = Math.min(width, height) / 2
    const labelRadius = (innerRadius + outerRadius) / 2
    const padAngle = 1 / outerRadius

    if (data) {
      const x = (d: any) => d[nameColumnId]
      const y = (d: any) => d[valueColumnId]

      // Data
      const N = d3.map(data, x)
      const V = d3.map(data, y)
      const I = d3.range(N.length).filter(i => !isNaN(V[i]))

      const names = new d3.InternSet(N)
      const colors = d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), names.size)
      const color = d3.scaleOrdinal(names, colors)

      const formatValue = d3.format(",")
      const title = (i: any) => `${N[i]}\n${formatValue(V[i])}`

      const arcs = d3.pie().padAngle(padAngle).sort(null).value((i: any) => V[i])(I)
      const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
      const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius)

      // Render
      const canvas = d3.select("#canvas")
      const svg = canvas
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

      svg.append("g")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .selectAll("path")
        .data(arcs)
        .join("path")
          .attr("fill", (d: any) => color(N[d.data]))
          .attr("d", arc as any)
        .append("title")
          .text(d => title(d.data))

      svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(arcs)
        .join("text")
          .attr("transform", (d: any) => `translate(${arcLabel.centroid(d)})`)
        .selectAll("tspan")
        .data((d: any) => {
          const lines = `${title(d.data)}`.split(/\n/)
          return (d.endAngle - d.startAngle) > 0.25 ? lines : lines.slice(0, 1)
        })
        .join("tspan")
          .attr("x", 0)
          .attr("y", (_, i) => `${i * 1.1}em`)
          .attr("font-weight", (_, i) => i ? null : "bold")
          .text(d => d)

      return () => {
        svg.remove()
      }
    }
  }, [ dimensions, data, nameColumnId, valueColumnId ])


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
