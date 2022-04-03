import React, { FC, CSSProperties } from 'react';

import { useAppSelector } from 'hooks'
import { selectComponents } from 'state/selectors'

const BUFFER = 1.5

interface CanvasPreviewProps {
  workspace: string
  highlight?: [number, number, number, number]
}

const CanvasPreview: FC<CanvasPreviewProps> = (props) => {
  const { workspace, highlight } = props
  const components = useAppSelector(state => selectComponents(state, workspace))

  let xmin = -1000
  let xmax = 1000
  let ymin = -1000
  let ymax = 1000

  components.forEach(component => {
    const x = component.position[0]
    const y = component.position[1]

    if (x < xmin) {
      xmin = x
    }
    if (x > xmax) {
      xmax = x
    }
    if (y < ymin) {
      ymin = y
    }
    if (y > ymax) {
      ymax = y
    }
  })

  xmin = xmin * BUFFER
  xmax = xmax * BUFFER
  ymin = ymin * BUFFER
  ymax = ymax * BUFFER

  const visibleExtent = () => {
    const style: CSSProperties = {
      fill: "none",
      stroke: "#F58623",
      strokeWidth: 10
    }

    if (highlight && components.length > 0) {
      return <rect style={style} x={highlight[0]} y={highlight[1]} width={highlight[2]} height={highlight[3]} />
    }
  }

  const previews = components.map(component => {
    const x = component.position[0]
    const y = component.position[1]

    if (component.type === "source" || component.type === "collection") {
      return <rect x={x} y={y} width="196" height="96" key={component.id} />
    } else {
      return <circle cx={x} cy={y} r="40" key={component.id} />
    }
  })


  return (
    <div style={{position: "relative", height: "100%", width: "100%"}}>
      <svg style={{position: "absolute", height: "100%", width: "100%"}} xmlns="http://www.w3.org/2000/svg" viewBox={`${xmin} ${ymin} ${xmax-xmin} ${ymax-ymin}`} preserveAspectRatio="xMaxYMax">

        { visibleExtent() }

        { previews }

      </svg>
    </div>
  )
}

export default CanvasPreview

