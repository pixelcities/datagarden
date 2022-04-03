import React, { forwardRef } from 'react'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectTransformerById } from 'state/selectors'
import { Coords, WindowDimensions, Component } from 'types'
import { addTransformerTarget, setTransformerPosition } from 'state/actions'
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

  const setComponentPosition = (payload: any) => {
    dispatch(setTransformerPosition(payload))
  }

  const addComponentTarget = (payload: any) => {
    dispatch(addTransformerTarget(payload))
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
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <circle cx="20" cy="20" r="20" fill="#363636" />
        <use href={sprites + "#" + myTransformer?.type} style={{color: "white"}} transform="scale(0.5)" x="50%" y="50%" />
      </svg>
    </DComponent>
  )
})

export default DTransformer
export { DTransformer }
