import React, { useEffect, useState, forwardRef } from 'react'
import { useAppDispatch, useAppSelector } from 'hooks'
import { Coords, WindowDimensions, Component } from 'types'
import { setCollectionPosition, addCollectionTarget } from 'state/actions'
import { selectActiveDataSpace, selectMetadataMap } from 'state/selectors'
import DComponent from './DComponent'
import { useKeyStoreContext } from 'contexts'

import './DCollection.sass'

interface DCollectionProps {
  collection: Component,
  offset: Coords,
  zoom: number,
  parentCoords: Coords,
  dimensions: WindowDimensions,
  onClick: any
}

const DCollection = forwardRef<{[id: string]: any}, DCollectionProps>((props, _refs) => {
  const { collection, offset, zoom, parentCoords, dimensions, onClick } = props
  const dispatch = useAppDispatch()
  const { keyStore } = useKeyStoreContext()
  const [title, setTitle] = useState("")

  const setComponentPosition = (payload: {id: string, workspace: string, position: number[]}) => {
    dispatch(setCollectionPosition(payload))
  }

  const addComponentTarget = (payload: {id: string, workspace: string, target: string}) => {
    dispatch(addCollectionTarget(payload))
  }

  let ellipseA = collection.color
  let ellipseB = collection.color

  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => {
    const maybe_name = metadata[collection.id]
    const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : collection.id;

    setTitle(name)
  }, [ metadata, collection.id, keyStore, dataSpace ])

  return (
    <DComponent
      ref={_refs}
      component={collection}
      offset={offset}
      zoom={zoom}
      parentCoords={parentCoords}
      dimensions={dimensions}
      setComponentPosition={setComponentPosition}
      addComponentTarget={addComponentTarget}
      onClick={onClick}
    >
      <div className="data-box" style={{position: "relative", backgroundColor: collection.color}}>
        <h1 className="data-header">
          <span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5312 5.0625L12.9375 2.46875C12.6562 2.1875 12.25 2 11.875 2H5.46875C4.65625 2.03125 4 2.6875 4 3.53125V16.5312C4 17.3438 4.65625 18 5.46875 18H14.5C15.3125 18 16 17.3438 16 16.5312V6.125C16 5.75 15.8125 5.34375 15.5312 5.0625ZM12 3.03125C12.0625 3.0625 12.1562 3.09375 12.2188 3.15625L14.8438 5.78125C14.9062 5.84375 14.9375 5.9375 14.9688 6.03125H12V3.03125ZM15 16.5312C15 16.7812 14.75 17.0312 14.5 17.0312H5.46875C5.21875 17.0312 4.96875 16.7812 4.96875 16.5312V3.53125C4.96875 3.25 5.21875 3 5.46875 3H11V6.28125C11 6.6875 11.3125 7 11.75 7H15V16.5312ZM6 8.5V15.5C6 15.7812 6.21875 16 6.5 16H13.5C13.75 16 14 15.7812 14 15.5V8.5C14 8.25 13.75 8 13.5 8H6.5C6.21875 8 6 8.25 6 8.5ZM13 15H10.5V13.5H13V15ZM13 12.5H10.5V11H13V12.5ZM7 9H13V10H7V9ZM7 11H9.5V12.5H7V11ZM7 13.5H9.5V15H7V13.5Z" fill="#363636"/>
            </svg>
          </span>

          { title }
        </h1>

        <div className="bottom-elipse">
          <svg width="15" height="10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="0" r="4" transform="rotate(90 5 5)" fill={ellipseA} stroke="#363636"/>
            <circle cx="5" cy="5" r="4" transform="rotate(90 5 5)" fill={ellipseB} stroke="#363636"/>
          </svg>
        </div>

        <p className="bottom-date">
          2021/03/13
        </p>


      </div>
    </DComponent>
  )
})

export default DCollection
export { DCollection }
