import * as d3 from 'd3'


const WIDTH = 800
const HEIGHT = 600

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

export const renderHistogram = (data: any, columnId: string, xLabel: string, yLabel: string, nrBins: number): SVGSVGElement => {
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
    .attr("transform", `translate(0,${HEIGHT - margin.bottom})`)
    .call(xAxis)
    .call(g => g.append("text")
      .attr("x", WIDTH - margin.right)
      .attr("y", 27)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text(xLabel));

  return node
}

