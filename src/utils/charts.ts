import * as d3 from 'd3'


const WIDTH = 800
const HEIGHT = 600

export const wrapChartContent = (svg: string, height: number | undefined = 640) => {
 const start = `<svg width=${height * 1.5} height=${height} style="display: block; margin: auto;">`
 const end = '</svg>'

 return start + svg + end
}

export const renderDonut = (data: any, nameColumnId: string, valueColumnId: string): SVGSVGElement => {
  // Constants
  const innerRadius = Math.min(WIDTH, HEIGHT) / 3
  const outerRadius = Math.min(WIDTH, HEIGHT) / 2
  const labelRadius = (innerRadius + outerRadius) / 2
  const padAngle = 1 / outerRadius

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
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT])
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

  return node
}

export const renderHistogram = (data: any, columnId: string, xLabel: string, yLabel: string, color: string, nrBins: number): SVGSVGElement => {
  const x = (d: any) => d[columnId]
  const y = () => 1

  // Constants
  const margin = { top: 25, right: 50, bottom: 50, left: 50 }
  const xRange = [margin.left, WIDTH - margin.right]
  const yRange = [HEIGHT - margin.bottom, margin.top]
  const xType = d3.scaleLinear
  const yType = d3.scaleLinear

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
  const xAxis = d3.axisBottom(xScale).ticks(WIDTH / 80, undefined).tickSizeOuter(0)
  const yAxis = d3.axisLeft(yScale).ticks(HEIGHT / 40, undefined)
  const yFormat = yScale.tickFormat(100, undefined)

  // Render
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .append("svg")
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", WIDTH - margin.left - margin.right)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(yLabel && yLabel !== "" && "↑" + yLabel))

  svg.append("g")
    .attr("fill", color || "#3457A6")
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
    .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
    .call(xAxis)
    .call(g => g.append("text")
      .attr("x", WIDTH - margin.right)
      .attr("y", 27)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel && xLabel !== "" && xLabel + " →"));

  return node
}

export const renderBar = (data: any, nameColumnId: string, valueColumnId: string, xLabel: string, yLabel: string, yFormat: string, color: string, sort: string): SVGSVGElement => {
  const x = (d: any) => d[nameColumnId]
  const y = (d: any) => d[valueColumnId]

  // Constants
  const margin = { top: 25, right: 50, bottom: 50, left: 50 }
  const xRange = [margin.left, WIDTH - margin.right]
  const yRange = [HEIGHT - margin.bottom, margin.top]
  const yType = d3.scaleLinear
  const xPadding = 0.1

  // Data values
  const X = d3.map(data, x)
  const Y = d3.map(data, y)

  // Domains
  let xDomain: d3.InternSet<number>
  if (sort === "Ascending") {
    xDomain = new d3.InternSet(d3.groupSort(data, ([d]) => y(d), x) as number[])
  } else if (sort === "Descending") {
    xDomain = new d3.InternSet(d3.groupSort(data, ([d]) => -y(d), x) as number[])
  } else {
    xDomain = new d3.InternSet(d3.rollups(data, d => ([d]: any) => y(d), x).map(([k]) => k) as number[])
  }
  const yDomain = [0, d3.max(Y)] as number[]

  const I = d3.range(X.length).filter(i => xDomain.has(X[i]))

  // Scales and axes
  const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding)
  const yScale = yType(yDomain, yRange)
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0)
  const yAxis = d3.axisLeft(yScale).ticks(HEIGHT / 40, yFormat)

  // Labels
  const formatValue = yScale.tickFormat(100, yFormat)
  const yText = (i: number) => `${X[i]}\n${formatValue(Y[i])}`

  // Render
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .append("svg")
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", WIDTH - margin.left - margin.right)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(yLabel && yLabel !== "" && "↑" + yLabel));

  svg.append("g")
    .attr("fill", color || "#3457A6")
    .selectAll("rect")
    .data(I)
    .join("rect")
      .attr("x", i => xScale(X[i])!)
      .attr("y", i => yScale(Y[i]))
      .attr("height", i => yScale(0) - yScale(Y[i]))
      .attr("width", xScale.bandwidth())
    .text(yText)

  svg.append("g")
    .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
    .call(xAxis)
    .call(g => g.append("text")
      .attr("x", WIDTH - margin.right)
      .attr("y", 27)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel && xLabel !== "" && xLabel + " →"))

  return node
}

export const renderLine = (data: any, timeColumnId: string, valueColumnId: string, xLabel: string, yLabel: string, color: string): SVGSVGElement => {
  const x = (d: any) => new Date(d[timeColumnId])
  const y = (d: any) => d[valueColumnId]

  // Constants
  const margin = { top: 25, right: 50, bottom: 50, left: 50 }
  const xRange = [margin.left, WIDTH - margin.right]
  const yRange = [HEIGHT - margin.bottom, margin.top]
  const xType = d3.scaleUtc
  const yType = d3.scaleLinear

  // Data values
  const X = d3.map(data, x)
  const Y = d3.map(data, y)

  const I = d3.range(X.length)
  const D = d3.map(data, (d, i) => X[i].toString() !== "Invalid Date" && !isNaN(Y[i]))

  // Domains
  const xDomain = d3.extent(X) as Date[]
  const yDomain = [0, d3.max(Y)] as number[]

  // Scales and axes
  const xScale = xType(xDomain, xRange)
  const yScale = yType(yDomain, yRange)
  const xAxis = d3.axisBottom(xScale).ticks(WIDTH / 80).tickSizeOuter(0)
  const yAxis = d3.axisLeft(yScale).ticks(HEIGHT / 40, undefined)

  // Line
  const line = d3.line()
    .defined((d, i) => D[i])
    .curve(d3.curveLinear)
    .x((d, i) => xScale(X[i]))
    .y((d, i) => yScale(Y[i]))

  // Render
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .append("svg")
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

   svg.append("g")
    .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
    .call(xAxis)
    .call(g => g.append("text")
      .attr("x", WIDTH - margin.right)
      .attr("y", 27)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel && xLabel !== "" && xLabel + " →"))

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", WIDTH - margin.left - margin.right)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(yLabel && yLabel !== "" && "↑" + yLabel))

  svg.append("path")
    .attr("fill", "none")
    .attr("stroke", color || "#3457A6")
    .attr("stroke-width", 1.5)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("stroke-opacity", 1)
    .attr("d", line(I as any))

  return node
}

export const renderArea = (data: any, timeColumnId: string, valueColumnId: string, xLabel: string, yLabel: string, color: string): SVGSVGElement => {
  const x = (d: any) => new Date(d[timeColumnId])
  const y = (d: any) => d[valueColumnId]

  // Constants
  const margin = { top: 25, right: 50, bottom: 50, left: 50 }
  const xRange = [margin.left, WIDTH - margin.right]
  const yRange = [HEIGHT - margin.bottom, margin.top]
  const xType = d3.scaleUtc
  const yType = d3.scaleLinear

  // Data values
  const X = d3.map(data, x)
  const Y = d3.map(data, y)

  const I = d3.range(X.length)
  const D = d3.map(data, (d, i) => X[i].toString() !== "Invalid Date" && !isNaN(Y[i]))

  // Domains
  const xDomain = d3.extent(X) as Date[]
  const yDomain = [0, d3.max(Y)] as number[]

  // Scales and axes
  const xScale = xType(xDomain, xRange)
  const yScale = yType(yDomain, yRange)
  const xAxis = d3.axisBottom(xScale).ticks(WIDTH / 80).tickSizeOuter(0)
  const yAxis = d3.axisLeft(yScale).ticks(HEIGHT / 40, undefined)

  // Area
  const area = d3.area()
    .defined((d, i) => D[i])
    .curve(d3.curveLinear)
    .x((d, i) => xScale(X[i]))
    .y0(yScale(0))
    .y1((d, i) => yScale(Y[i]));

  // Render
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .append("svg")
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", WIDTH - margin.left - margin.right)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(yLabel && yLabel !== "" && "↑" + yLabel))

  svg.append("path")
      .attr("fill", color || "#3457A6")
      .attr("d", area(I as any))

  svg.append("g")
      .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
      .call(xAxis)
    .call(g => g.append("text")
      .attr("x", WIDTH - margin.right)
      .attr("y", 27)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel && xLabel !== "" && xLabel + " →"))

  return node
}

