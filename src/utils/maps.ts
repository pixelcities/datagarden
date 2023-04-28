import * as d3 from 'd3'


const WIDTH = 360 * 2
const HEIGHT = 180 * 2

export const wrapMapContent = (svg: string, height: number | undefined = 640) => {
 const start = `<svg width=${height * 1.5} height=${height} style="display: block; margin: auto;">`
 const end = '</svg>'

 return start + svg + end
}

export const renderChoropleth = (data: any, nameColumnId: string, valueColumnId: string, geomColumnId: string, valueFormat: string, colorRamp: string): SVGSVGElement => {
  // Constants
  const scale = d3.scaleQuantize
  const range = d3.schemeBlues[9]
  const unknown = "#ccc"

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
  const domain = d3.extent(V) as number[]

  // Scales
  const color = scale(domain, range)
  if (color.unknown && unknown !== undefined) color.unknown(unknown)

  // Hover
  const title = (f: any, i: number) => {
    return `${data[i][nameColumnId]}\n${V[i]}${valueFormat}`
  }

  // Geopath
  const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], geojson)
  const path = d3.geoPath(projection)

  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const svg = d3.select(node)
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .attr("style", "width: 100%; height: auto; height: intrinsic;")

  svg.append("g")
    .selectAll<SVGRectElement, any>("path")
    .data<any>(features)
    .join("path")
      .attr("fill", (d, i) => color(V[i]))
      .attr("d", path)
    .append("title")
      .text((d, i) => title(d, i))

  return Object.assign(node, {scales: {color}})
}

