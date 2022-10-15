import React, { FC, useRef, useMemo, useLayoutEffect, useState, useEffect } from 'react';
import * as d3 from 'd3'
import Dropdown from 'components/Dropdown'

import { Schema } from 'types'
import { useDataFusionContext } from 'contexts'

interface GraphProps {
  id: string,
  collectionId: string,
  columnNames: {[key: string]: string},
  schema: Schema
}


const Graph: FC<GraphProps> = ({ id, collectionId, columnNames, schema }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({height: 0, width: 0})
  const [column, setColumn] = useState<string | null>(null)

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

  const columnId = useMemo(() => {
    const selection = Object.entries(columnNames).find(([k, v]) => v === column)

    if (selection) {
      return selection[0]
    }
  }, [ columnNames, column ])

  useEffect(() => {
    const margin = { top: 25, right: 50, bottom: 50, left: 50 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    // Constants
    const xRange = [margin.left, width - margin.right]
    const yRange = [height - margin.bottom, margin.top]
    const xType = d3.scaleLinear
    const yType = d3.scaleLinear
    const xLabel = column
    const yLabel = "Frequency"
    const nrBins = 10

    if (data && columnId) {
      const x = (d: any) => d[columnId]
      const y = () => 1

      // Data values
      const X = d3.map(data, x)
      const Y0 = d3.map(data, y)
      const I = d3.range(X.length)

      // Bins
      const bins = d3.bin().thresholds(nrBins).value(i => X[i])(I)
      const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]))

      // Domains
      const xDomain = [bins[0].x0, bins[bins.length - 1].x1] as number[]
      const yDomain = [0, d3.max(Y)] as number[]

      // Scales and axes
      const xScale = xType(xDomain, xRange)
      const yScale = yType(yDomain, yRange)
      const xAxis = d3.axisBottom(xScale).ticks(width / 80, undefined).tickSizeOuter(0)
      const yAxis = d3.axisLeft(yScale).ticks(height / 40, undefined)
      const yFormat = yScale.tickFormat(100, undefined)

      // Render
      const canvas = d3.select("#canvas")
      const svg = canvas
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

      svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(yAxis)
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").clone()
              .attr("x2", width - margin.left - margin.right)
              .attr("stroke-opacity", 0.1))
          .call(g => g.append("text")
              .attr("x", -margin.left)
              .attr("y", 10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .text(yLabel));

      svg.append("g")
          .attr("fill", "steelblue")
        .selectAll("rect")
        .data(bins)
        .join("rect")
          .attr("x", d => xScale(d.x0 as number) + 0.5)
          .attr("width", d => Math.max(0, xScale(d.x1 as number) - xScale(d.x0 as number) - 0.5 - 0.5))
          .attr("y", (d, i) => yScale(Y[i]))
          .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
        .append("title")
          .text((d, i) => [`${d.x0 as number} ≤ x < ${d.x1 as number}`, yFormat(Y[i])].join("\n"));

      svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(xAxis)
          .call(g => g.append("text")
              .attr("x", width - margin.right)
              .attr("y", 27)
              .attr("fill", "currentColor")
              .attr("text-anchor", "end")
              .text(xLabel));

      return () => {
        svg.remove()
      }
    }
  }, [ dimensions, data, column, columnId ])


  return (
    <div ref={ref} style={{width: "100%", height: "90%"}}>
      <svg id="canvas" width={dimensions.width} height={dimensions.height} />

      <div className="columns is-centered">
        <div className="column is-narrow">
          <Dropdown
            items={Object.values(columnNames)}
            onClick={(item: string) => setColumn(item)}
            isDropUp={true}
          />
        </div>
      </div>
    </div>
  )
}

export default Graph
