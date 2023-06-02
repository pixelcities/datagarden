import React, { forwardRef, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectTransformerById } from 'state/selectors'
import { Coords, WindowDimensions, Component } from 'types'
import { addTransformerTarget, setTransformerPosition, deleteTransformer } from 'state/actions'
import DComponent from './DComponent'

import sprites from 'assets/t-sprites.svg'

interface DTransformerProps {
  transformer: Component,
  offset: Coords,
  zoom: number,
  parentCoords: Coords,
  dimensions: WindowDimensions,
  onClick: any
}

const DTransformer = forwardRef<{[id: string]: any}, DTransformerProps>((props, _refs) => {
  const { transformer, offset, zoom, parentCoords, dimensions, onClick } = props
  const dispatch = useAppDispatch()
  const myTransformer = useAppSelector(state => selectTransformerById(state, transformer?.id))

  const positionRef = useRef(transformer.position)
  positionRef.current = transformer.position

  const setComponentPosition = (payload: {id: string, workspace: string, position: number[]}) => {
    if (Math.abs(positionRef.current[0] - payload.position[0]) > 1 || Math.abs(positionRef.current[1] - payload.position[1]) > 1) {
      dispatch(setTransformerPosition(payload))
    }
  }

  const addComponentTarget = (payload: any) => {
    dispatch(addTransformerTarget(payload))
  }

  const deleteComponent = (payload: any) => {
    dispatch(deleteTransformer(payload))
  }

  return (
    <DComponent
      ref={_refs}
      component={transformer}
      offset={offset}
      zoom={zoom}
      parentCoords={parentCoords}
      dimensions={dimensions}
      setComponentPosition={setComponentPosition}
      addComponentTarget={addComponentTarget}
      deleteComponent={deleteComponent}
      onClick={onClick}
    >
      <>
        { myTransformer?.error &&
          <div style={{position: "absolute", top: 0, right: 0, marginTop: -7.5, marginRight: -2.5, zIndex: 1}}>
            <span className="icon is-small has-tooltip-danger" data-tooltip={myTransformer?.error}>
              <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#f03158"/>
            </span>
          </div>
        }

        <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
          <circle cx="20" cy="20" r="20" fill="#363636" />
          <use href={sprites + "#" + myTransformer?.type} style={{color: "white"}} transform="scale(0.5)" x="50%" y="50%" />
        </svg>
      </>
    </DComponent>
  )
})

export default DTransformer
export { DTransformer }
