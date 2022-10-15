import React, { forwardRef } from 'react'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectWidgetById } from 'state/selectors'
import { Coords, WindowDimensions, Component } from 'types'
import { setWidgetPosition, deleteWidget } from 'state/actions'
import DComponent from './DComponent'

import sprites from 'assets/t-sprites.svg'

interface DWidgetProps {
  widget: Component,
  offset: Coords,
  zoom: number,
  parentCoords: Coords,
  dimensions: WindowDimensions,
  onClick: any
}

const DWidget = forwardRef<{[id: string]: any}, DWidgetProps>((props, _refs) => {
  const { widget, offset, zoom, parentCoords, dimensions, onClick } = props
  const dispatch = useAppDispatch()
  const myWidget = useAppSelector(state => selectWidgetById(state, widget?.id))

  const setComponentPosition = (payload: any) => {
    dispatch(setWidgetPosition(payload))
  }

  const deleteComponent = (payload: any) => {
    dispatch(deleteWidget(payload))
  }

  return (
    <DComponent
      ref={_refs}
      component={widget}
      offset={offset}
      zoom={zoom}
      parentCoords={parentCoords}
      dimensions={dimensions}
      setComponentPosition={setComponentPosition}
      addComponentTarget={() => {}}
      deleteComponent={deleteComponent}
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <rect width="40" height="40" rx="5" ry="5" fill="#363636" />
        <use href={sprites + "#" + myWidget?.type} style={{color: "white"}} transform="scale(0.5)" x="50%" y="50%" />
      </svg>
    </DComponent>
  )
})

export default DWidget
export { DWidget }
