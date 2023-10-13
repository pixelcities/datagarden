import * as d3 from 'd3'
import type { ScaleQuantile, ScaleQuantize } from 'd3'

const WIDTH = 360 * 2
const HEIGHT = 180 * 2

export enum MapClassification {
  Quantile = "Equal Counts (Quantile)",
  Quantize = "Equal Interval (Quantize)"
}

export enum ColorRamp {
  Blues = "Blues",
  Greens = "Greens",
  Oranges = "Oranges",
  Purples = "Purples",
  Reds = "Reds",

  PuOr = "Purple / Orange",
  RdBu = "Red / Blue",
  RdYlBu = "Red / Yellow / Blue",
  Spectral = "Spectral"
}

export const renderChoropleth = (data: any, classification: string, nrClasses: number, nameColumnId: string, valueColumnId: string, geomColumnId: string, legendTitle: string, valueFormat: string, colorRamp: string, transform: string, setTransform: undefined | ((t: string) => void) = undefined): any => {
  // Constants
  const unknown = "#ccc"
  const tickSize = 6
  const legendWidth = WIDTH / 3
  const legendHeight = 64 + tickSize
  const margin = { top: 40, right: 0, bottom: 14 + tickSize, left: 10 }
  const ticks = legendWidth / 64

  // Color Scheme
  const colors: readonly (readonly string[])[] = colorRamp !== "" ? (d3 as any)[`scheme${colorRamp}`] : d3.schemeBlues
  const range = colors[nrClasses >= 3 && nrClasses <= 9 ? nrClasses : 5]

  // Data
  const value = (d: any) => d[valueColumnId]
  const V = d3.map(data, value).map(d => d == null ? NaN : +d)
  const features = data.map((d: any, i: number) => geomColumnId && JSON.parse(d[geomColumnId]))
  const geojson: any = {
    type: "FeatureCollection",
    features: features.map((f: any) => {
      if (f.type === "Feature" || f.type === "FeatureCollection") {
        return f
      } else {
        return {"type": "Feature", "geometry": f}
      }
    })
  }

  // Domains
  const domain = [d3.quantile(V, 0.005), d3.quantile(V, 0.995)] as number[]

  // Scales
  const color =
    classification === "Quantile" ? d3.scaleQuantile(V, range).unknown(unknown) :
    classification === "Quantize" ? d3.scaleQuantize(domain, range).unknown(unknown) :
    d3.scaleLinear<string>().domain(domain).range(colors[3])

  const thresholds =
    classification === "Quantile" ? (color as ScaleQuantile<string, string>).quantiles() :
    classification === "Quantize" ? (color as ScaleQuantize<string, string>).copy().nice().thresholds() :
    color.domain()

  // Hover
  const title = (f: any, i: number) => {
    const name = nameColumnId !== "" ? data[i][nameColumnId] + "\n" : ""
    return `${name}${V[i]}${valueFormat}`
  }

  // Geopath
  const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], geojson)
  const path = d3.geoPath(projection)

  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("preserveAspectRatio", "xMidYMin")
    .attr("style", "width: 100%; height: auto; height: intrinsic;")

  // Legend
  const x = d3.scaleLinear()
    .domain([-1, color.range().length - 1])
    .rangeRound([margin.left, legendWidth - margin.right])

  svg.append("g")
    .selectAll("rect")
    .data<any>(color.range())
    .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", margin.top)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", legendHeight - margin.top - margin.bottom)
      .attr("fill", d => d)

  const tickValues = d3.range(thresholds.length)
  const isInt = thresholds.reduce(Number.isInteger, true)
  const tickFormat: any = (i: number) => thresholds[i].toFixed(isInt ? 0 : 1)
  const tickAdjust = (g: any) => g.selectAll(".tick line").attr("y1", margin.top + margin.bottom - legendHeight)

  svg.append("g")
    .attr("transform", `translate(0,${legendHeight - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(ticks)
      .tickFormat(tickFormat)
      .tickSize(tickSize)
      .tickValues(tickValues))
    .call(tickAdjust)
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", margin.left)
      .attr("y", margin.top + margin.bottom - legendHeight - tickSize)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("font-family", "Nunito Sans")
      .attr("font-weight", "800")
      .text(legendTitle && valueFormat !== "" ? legendTitle + " (" + valueFormat + ")" : legendTitle))

  // Map data
  const wrapper = svg.append("g")
  wrapper.append("g")
    .selectAll<SVGRectElement, any>("path")
    .data<any>(features)
    .join("path")
      .attr("fill", (d, i) => color(V[i]))
      .attr("d", path)
    .append("title")
      .text((d, i) => title(d, i))

  // Zoom & pan
  const zoom = d3.zoom()
    .scaleExtent([-10, 10])
    .on("zoom", ({ transform, sourceEvent }) => {
      if (sourceEvent !== null && setTransform) {
        setTransform(JSON.stringify(transform))

        wrapper.attr("transform", "translate(" + transform.x / 2 + "," + transform.y / 2 + ") scale(" + transform.k + ")")
        wrapper.attr("stroke-width", 1 / transform.k)
      }
    }) as any

  // Transform
  if (transform !== "") {
    const { k, x, y } = JSON.parse(transform) as {k: number, x: number, y: number}

    svg.call(zoom.scaleBy, k)
    svg.call(zoom.translateBy, x / 2, y / 2)

    wrapper.attr("transform", "translate(" + x / 2 + "," + y / 2 + ") scale(" + k + ")")
    wrapper.attr("stroke-width", 1 / k)
  }

  svg.call(zoom)

  return node
}

