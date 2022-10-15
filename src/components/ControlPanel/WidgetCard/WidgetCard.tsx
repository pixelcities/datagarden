import React, { FC } from 'react'
import { useDrag } from 'react-dnd'

import { useAppDispatch, useAppSelector } from 'hooks'
import { createWidget, createMetadata } from 'state/actions'
import { selectActiveDataSpace } from 'state/selectors'

import { useKeyStoreContext } from 'contexts'

import sprites from 'assets/t-sprites.svg'


interface WidgetCardProps {
  title: string,
  type: string,
  isDisabled?: boolean
}

interface Coords {
  x: number,
  y: number
}

const WidgetCard: FC<WidgetCardProps> = ({ title, type, isDisabled }) => {
  const dispatch = useAppDispatch()
  const { keyStore } = useKeyStoreContext();
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const id = crypto.randomUUID()

  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: "ControlPanel",
      item: { id },
      end: (e, monitor) => {
        const result: Coords = monitor.getDropResult() || {x: 0, y: 0}

        dispatch(createMetadata({
          id: id,
          workspace: "default",
          metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, `${id} [${type}]`)
        }))

        dispatch(createWidget({
          id: id,
          workspace: "default",
          type: type,
          targets: [],
          position: [result.x, result.y],
          collection: undefined,
          is_ready: false
        }))
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1
      })
    }),
    []
  )

  return (
    <>
      <div className="card-block"
        ref={isDisabled ? null : dragRef}
        style={{opacity: opacity, cursor: (isDisabled ? "default" : "pointer"), backgroundColor: (isDisabled ? "#3c3c3c3d" : "#ffffff")}}
      >
        <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
          <use href={sprites + "#" + type} style={{color: "black"}} />
        </svg>

        <p className="card-link has-text-centered">
          { type }
        </p>

      </div>
    </>
  )
}

export default WidgetCard
