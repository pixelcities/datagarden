import React, { forwardRef, useCallback, useState, useLayoutEffect, CSSProperties } from 'react'
import { gsap, TweenLite } from 'gsap'

import { useAppSelector } from 'hooks'
import { selectWindowDimensions } from 'state/selectors'
import { Coords, WindowDimensions } from 'types'

import './Connector.sass'

const bezierWeight = 0.675;
const style: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  zIndex: -999
}

interface ConnectorProps {
  position: number[],
  dimensions: WindowDimensions,
  zoom: number
}

const Connector = forwardRef<{[id: string]: any}, ConnectorProps>((props, _refs) => {
  const refs: React.MutableRefObject<{[id: string]: any}> = (_refs as React.MutableRefObject<{[id: string]: any}>)
  const { position, dimensions, zoom } = props

  const [ pathData, setPathData ] = useState("")

  const windowDimensions = useAppSelector(selectWindowDimensions)

  const ref = refs.current?.dragRef
  const handleA = refs.current?.handleARef
  const handleB = refs.current?.handleBRef
  const connectorRef = refs.current?.connectorRef
  const draggableCallback = refs.current?.draggableCallback

  const x = (+gsap.getProperty(ref?.current, "x") ?? position[0]) + dimensions.width
  const y = (+gsap.getProperty(ref?.current, "y") ?? position[1]) + dimensions.height/2

  const resetConnector = () => {
    TweenLite.set(connectorRef.current, { autoAlpha: 0 })
    TweenLite.set([handleA.current, handleB.current], {
      x: x,
      y: y
    })

    setPathData("")
  }

  const updateConnectorPath = () => {
    const x1: number = +gsap.getProperty(handleA.current, "x")
    const y1: number = +gsap.getProperty(handleA.current, "y")
    const x2: number = +gsap.getProperty(handleB.current, "x")
    const y2: number = +gsap.getProperty(handleB.current, "y")

    const dx = Math.abs(x2 - x1) * bezierWeight;

    const dx1 = x1 - dx;
    const dx2 = x2 + dx;

    setPathData(`M${x1} ${y1} C ${dx1} ${y1} ${dx2} ${y2} ${x2} ${y2}`)
  }

  draggableCallback?.addEventListener("drag", updateConnectorPath)
  draggableCallback?.addEventListener("release", resetConnector)

  useLayoutEffect(() => {
    if (connectorRef?.current) {
      TweenLite.set(connectorRef.current, { autoAlpha: 0 })
    }
  }, [ connectorRef ])

  if (Number.isNaN(x) || Number.isNaN(y)) {
    return (<></>)
  }

  return (
    <svg ref={connectorRef} xmlns="http://www.w3.org/2000/svg" style={style} width={windowDimensions.width/zoom} height={windowDimensions.height/zoom}>
      <path className="path" d={pathData} />
      <circle className="handle" ref={handleA} cx="0" cy="0" r="8" transform={`translate(${x} ${y})`}/>
      <circle className="handle" ref={handleB} cx="0" cy="0" r="8" transform={`translate(${x} ${y})`}/>
    </svg>
  )
})


interface ConnectedConnectorProps {
  sourceA: string,
  sourceB: string,
  offset: Coords,
  zoom: number,
  windowDimensions: WindowDimensions
}

const ConnectedConnector = forwardRef<{[id: string]: any}, ConnectedConnectorProps>((props, _refs) => {
  const refs: React.MutableRefObject<{[id: string]: any}> = (_refs as React.MutableRefObject<{[id: string]: any}>)
  const { sourceA, sourceB, offset, zoom, windowDimensions } = props

  const [ pathData, setPathData ] = useState("")


  const sourceARefs = refs.current?.[sourceA]
  const sourceBRefs = refs.current?.[sourceB]

  const sourceADragRef = sourceARefs?.current?.dragRef
  const sourceACallback = sourceARefs?.current?.draggableCallback

  const sourceBDragRef = sourceBRefs?.current?.dragRef
  const sourceBCallback = sourceBRefs?.current?.draggableCallback

  const updateConnectorPath = useCallback(() => {
    if (sourceADragRef?.current && sourceBDragRef?.current) {
      const rect1 = sourceBDragRef.current.getBoundingClientRect()
      const rect2 = sourceADragRef.current.getBoundingClientRect()

      const x1 = +gsap.getProperty(sourceBDragRef.current, "x")
      const y1 = +gsap.getProperty(sourceBDragRef.current, "y")+rect1.height/zoom/2
      const x2 = +gsap.getProperty(sourceADragRef.current, "x")+rect2.width/zoom
      const y2 = +gsap.getProperty(sourceADragRef.current, "y")+rect2.height/zoom/2

      const dx = Math.abs(x2 - x1) * bezierWeight;

      const dx1 = x1 - dx;
      const dx2 = x2 + dx;

      setPathData(`M${x1} ${y1} C ${dx1} ${y1} ${dx2} ${y2} ${x2} ${y2}`)
    }
  }, [sourceADragRef, sourceBDragRef, zoom])

  sourceACallback?.addEventListener("drag", updateConnectorPath)
  sourceBCallback?.addEventListener("drag", updateConnectorPath)

  useLayoutEffect(() => updateConnectorPath(), [ updateConnectorPath, sourceACallback, sourceBCallback, offset, zoom ])

  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} width={windowDimensions.width/zoom} height={windowDimensions.height/zoom}>
      <path className="path" d={pathData} />
    </svg>
  )

})

export default Connector

export { ConnectedConnector }
