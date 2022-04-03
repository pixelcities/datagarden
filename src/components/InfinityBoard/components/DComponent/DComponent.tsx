import React, { forwardRef, useEffect, useRef, useState, useLayoutEffect, CSSProperties } from 'react'

import { gsap, TweenLite } from 'gsap'
import { Draggable } from 'gsap/Draggable'

import { useAppDispatch } from 'hooks'
import { setComponentDimensions } from 'state/actions'
import { Coords, WindowDimensions, Component } from 'types'

import './DComponent.sass'
import Connector from '../Connector'


interface DComponentProps {
  component: Component,
  offset: Coords,
  zoom: number,
  parentCoords: Coords,
  dimensions: WindowDimensions,
  children: React.ReactNode,
  setComponentPosition: (payload: {id: string, workspace: string, position: number[]}) => void,
  addComponentTarget: any,
  onClick: any
}

const DComponent = forwardRef<{[id: string]: any}, DComponentProps>((props, _refs) => {
  const refs: React.MutableRefObject<{[id: string]: any}> = (_refs as React.MutableRefObject<{[id: string]: any}>)
  const { component, offset, zoom, parentCoords, setComponentPosition, addComponentTarget, onClick, children } = props

  const dispatch = useAppDispatch()

  const [ dims, setDims ] = useState({height: 0, width: 0})

  const ref = refs.current?.dragRef
  const proxyRef = useRef<SVGCircleElement | null>(null)
  const dragTarget = useRef<any>(null)
  const gsapRef = useRef<any>(null)
  const offsetRef = useRef<Coords>(offset)
  const zoomRef = useRef<number>(zoom)
  const parentCoordsRef = useRef<Coords>(parentCoords)
  const dimsRef = useRef<WindowDimensions>(dims)


  /*
     Allocate various refs for our connector so that the draggable
     instance is able to manipulate its location.
  */
  const handleA = useRef<SVGCircleElement | null>(null)
  const handleB = useRef<SVGCircleElement | null>(null)
  const connectorRef = useRef<SVGElement | null>(null)
  const childRefs = useRef<{[id: string]: any}>({})

  useEffect(() => {
    childRefs.current.dragRef = ref
    childRefs.current.handleARef = handleA
    childRefs.current.handleBRef = handleB
    childRefs.current.connectorRef = connectorRef
  }, [ ref, handleA, handleB, connectorRef ])

  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const width = rect.width / zoomRef.current
      const height = rect.height / zoomRef.current

      // TODO : update state components
      setDims({height: height, width: width})

      dispatch(setComponentDimensions({
        id: component.id,
        height: height,
        width: width
      }))
    }
  }, [ref, component, zoom, dispatch]);

  useLayoutEffect(() => {
    TweenLite.set([ref.current], {
      x: component.position[0]-offset.x,
      y: component.position[1]-offset.y
    })
  }, [ ref, component, offset ])

  // Small semicircles that capture a drag event for the connector
  const dragCircle = () => {
    const minHeight = 70
    const divHeight = dims.height > minHeight ? dims.height : minHeight
    const radius = divHeight / 8

    const fill = "#b3b3b3"
    const fillOpacity = 0.8

    return (
      <div className="drag-container">
        <div id={component.id} className="drag-parent">
        <div className="drag-block" style={{top: `calc(50% - ${radius}px)`, left: `-${radius}px`}}>
          <svg xmlns="http://www.w3.org/2000/svg" width={radius} height={radius*2}>
            <circle className="drag-connector-left" cx={radius} cy={radius} r={radius} style={{strokeWidth: "0", fill: fill, fillOpacity: fillOpacity}}/>
          </svg>
        </div>

        <div className="drag-block" style={{top: `calc(50% - ${radius}px)`, right: `${-radius}px`}}>
          <svg xmlns="http://www.w3.org/2000/svg" width={radius} height={radius*2}>
            <circle className="drag-connector-right" cx={0} cy={radius} r={radius} style={{strokeWidth: "0", fill: fill, fillOpacity: fillOpacity}}/>
          </svg>
        </div>

      </div></div>
    )
  }

  useLayoutEffect(() => {
    offsetRef.current = offset
  }, [ offset ])

  useLayoutEffect(() => {
    zoomRef.current = zoom
  }, [ zoom ])

  useLayoutEffect(() => {
    parentCoordsRef.current = parentCoords
  }, [ parentCoords ])

  useLayoutEffect(() => {
    dimsRef.current = dims
  }, [ dims ])

  useLayoutEffect(() => {
    gsapRef.current = Draggable.create(proxyRef.current, {
      allowContextMenu: true,
      trigger: ref.current,
      onClick: onClick,
      onPress: (e: any) => {
        const element: HTMLElement = e.target
        const targetClass = element?.getAttribute("class")

        switch (targetClass) {
          case "drag-connector-right":
            const x = +gsap.getProperty(ref.current, "x")+dimsRef.current.width
            const y = +gsap.getProperty(ref.current, "y")+dimsRef.current.height/2

            // force the child connector to become visible and snap to our current location
            TweenLite.set(connectorRef.current, { autoAlpha: 1 })
            TweenLite.set([handleA.current, handleB.current], {
              x: x,
              y: y
            })

            dragTarget.current = handleA.current
            break

          case "drag-parent":
            dragTarget.current = ref.current
            break

          default:
            break
        }
      },
      onDrag: () => {
        TweenLite.set(dragTarget.current, {
          x: `+=${gsapRef.current.deltaX}`,
          y: `+=${gsapRef.current.deltaY}`
        })

      },
      onRelease: (e: any) => {
        const element: HTMLElement = e.target
        const sourceId = component.id
        const targetId = element.getAttribute("id")

        // dragTarget is only set when the target moved more than 2px
        if (dragTarget.current) {
          // unset dragTarget for future drag detects
          dragTarget.current = null

          if (sourceId === targetId) {
            const newX = (+e.clientX - parentCoordsRef.current.x) / zoomRef.current - e.layerX + offsetRef.current.x
            const newY = (+e.clientY - parentCoordsRef.current.y) / zoomRef.current - e.layerY + offsetRef.current.y

            setComponentPosition({
              id: component.id,
              workspace: "default",
              position: [newX, newY]
            })


          } else if (targetId) {
            addComponentTarget({
              id: component.id,
              workspace: "default",
              target: targetId
            })
          }
        }
      }
     })[0]

    if (refs.current && childRefs.current) {
      refs.current.draggableCallback = gsapRef.current
      childRefs.current.draggableCallback = gsapRef.current
    }

  // eslint-disable-next-line
  }, [ ] )

  const style: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    lineHeight: 0
  }

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg">
        <circle ref={proxyRef} className="drag-proxy" cx="0" cy="0" r="1" fill="none" />
      </svg>

      <Connector
        ref={childRefs}
        position={component.position}
        dimensions={dims}
        zoom={zoom}
      />

      <div ref={ref} key={component.id} style={style}>
        { children }
        { dragCircle() }
      </div>
    </>
  )
})

export default DComponent
