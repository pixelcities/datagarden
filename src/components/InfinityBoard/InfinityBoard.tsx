import React, { FC, useMemo, useRef, useState, useLayoutEffect, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'hooks'
import { useDrop } from 'react-dnd'

import { selectComponents, selectConnectedComponents, selectCollectionById, selectTransformerById, selectCoords } from 'state/selectors'
import { setCoords, setWindowDimensions } from 'state/actions'
import usePan from 'hooks/usePan'
import useZoom from 'hooks/useZoom'

import grid from 'assets/grid.svg';

import { DCollection, DTransformer } from './components/DComponent'
import Collection from 'components/Collection'
import Transformer from 'components/Transformer'
import CanvasPreview from 'components/CanvasPreview'
import { ConnectedConnector } from './components/Connector'

import './InfinityBoard.sass';


const ORIGIN: {x: number, y: number} = Object.freeze({x: 0, y: 0})

const InfinityBoard: FC = (props) => {
  const [dimensions, setDimensions] = useState({height: 0, width: 0});
  const [buffer, setBuffer] = useState(ORIGIN)
  const [workspace, setWorkspace] = useState("default")
  const [activeCollectionId, setActiveCollectionId] = useState("")
  const [activeTransformerId, setActiveTransformerId] = useState("")

  const ref = useRef<HTMLDivElement | null>(null)
  const zoom = useZoom(ref)
  const offset = usePan(ref, zoom)
  const dispatch = useAppDispatch()

  const dragRefs = useRef<{[id: string]: any}>({})

  const coords = useAppSelector(selectCoords)
  const components = useAppSelector(state => selectComponents(state, workspace))
  const connectedComponents = useAppSelector(state => selectConnectedComponents(state, workspace))
  const activeCollection = useAppSelector(state => selectCollectionById(state, activeCollectionId))
  const activeTransformer = useAppSelector(state => selectTransformerById(state, activeTransformerId))

  const [, dropRef] = useDrop(() => ({
    accept: "ControlPanel",
    drop: (e, monitor) => {
      const dropCoords = monitor.getClientOffset() || coords
      return {
        x: dropCoords.x - coords.x + offset.x,
        y: dropCoords.y - coords.y + offset.y
      }
    }
  }), [coords, offset])

  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()

      dispatch(setCoords({
        x: rect.x,
        y: rect.y
      }))

      dispatch(setWindowDimensions({
        height: rect.height,
        width: rect.width
      }))

      setDimensions({
        height: rect.height,
        width: rect.width
      })
    }
  }, [ref, dispatch]);

  useLayoutEffect(() => {
    setBuffer({
      x: (dimensions.width - dimensions.width / zoom) / 2,
      y: (dimensions.height - dimensions.height / zoom) / 2
    })
  }, [dimensions, zoom, setBuffer])

  const style: CSSProperties = {
    position: "absolute",
    backgroundImage: `url(${grid})`,
    backgroundColor: "#eaeaea",
    transform: `scale(${zoom})`,
    backgroundPosition: `${-offset.x}px ${-offset.y}px`,
    bottom: buffer.y,
    left: buffer.x,
    right: buffer.x,
    top: buffer.y
  }

  const renderComponents = useMemo(() => {
    return components.map((component) => {
      /*
         Check if our component already has some space in the dragRefs object. If not we need
         create a nested ref object so that the child thinks it just got a normal forward after we
         extract the right component refs from the dragRefs. Because createRef creates a new pointer
         on every render, we should check for space ourselves.
      */
      if (dragRefs.current && !dragRefs.current[component.id]) {
        const localRefs = (React.createRef() as React.MutableRefObject<{[id: string]: any}>)
        localRefs.current = {
          "dragRef": (React.createRef() as React.MutableRefObject<HTMLDivElement | null>)
        }

        dragRefs.current[component.id] = localRefs
      }

      if (component.type === "source" || component.type === "collection") {
        return (
          <DCollection
            key={component.id}
            ref={dragRefs.current?.[component.id]}
            collection={component}
            offset={offset}
            zoom={zoom}
            parentCoords={coords}
            dimensions={dimensions}
            onClick={() => setActiveCollectionId(component.id)}
          />
        )

      } else {
        return (
          <DTransformer
            key={component.id}
            ref={dragRefs.current?.[component.id]}
            transformer={component}
            offset={offset}
            zoom={zoom}
            parentCoords={coords}
            dimensions={dimensions}
            onClick={() => setActiveTransformerId(component.id)}
          />
        )
      }
    })
  }, [ components, dragRefs, coords, dimensions, offset, zoom, setActiveCollectionId, setActiveTransformerId ])

  const renderConnectors = useMemo(() => {
    return connectedComponents.map(component => {
      return component.targets.map(target =>
        <ConnectedConnector
          key={component.id + target}
          ref={dragRefs}
          sourceA={component.id}
          sourceB={target}
          offset={offset}
          zoom={zoom}
          windowDimensions={dimensions}
        />
      )
    })
  }, [ connectedComponents, dragRefs, offset, zoom, dimensions ])

  const renderModal = useMemo(() => {
    if (activeCollection && activeCollection.is_ready) {
      return (
        <Collection
          id={activeCollection.id}
          uri={activeCollection.uri}
          schema={activeCollection.schema}
          onClose={() => setActiveCollectionId("")}
        />
      )
    } else if (activeTransformer) {
      return (
        <Transformer
          id={activeTransformer.id}
          collections={activeTransformer.collections}
          transformers={activeTransformer.transformers}
          wal={activeTransformer.wal}
          onClose={() => setActiveTransformerId("")}
        />
      )
    }
  }, [ activeCollection, activeTransformer ])

  return (
    <>

      { renderModal }

      <div style={{position: "relative", overflow: "hidden", height: "100%", width: "100%"}} ref={ref}>

        <div ref={dropRef} style={style} >

          { renderComponents }

          { renderConnectors }

        </div>

        <div className="box py-3" style={{position: "absolute", top: "30px", left: "30px"}}>
          <nav className="breadcrumb has-arrow-separator" aria-label="breadcrumbs">
            <ul>
              <li><Link to="#overview" className="has-text-primary has-text-weight-bold" onClick={() => setWorkspace("default")}>Overview</Link></li>
              <li className="is-active"><Link to="default" aria-current="page">Default workspace</Link></li>
            </ul>
          </nav>
        </div>

        <div style={{position: "absolute", bottom: "30px", left: "30px"}}>
          <span>{"{\"x\": " + offset.x + ", \"y\": " + offset.y + ", \"z\": " + zoom + "}"}</span>
        </div>

        <div className="preview" style={{position: "absolute", bottom: "30px", right: "30px", width: "200px", height: "200px" }}>
          <CanvasPreview
            workspace={workspace}
            highlight={[offset.x, offset.y, dimensions.width / zoom, dimensions.height / zoom]}
          />
        </div>
      </div>
    </>
  )
}

InfinityBoard.defaultProps = {
  backdrop: true
}

export default InfinityBoard;
