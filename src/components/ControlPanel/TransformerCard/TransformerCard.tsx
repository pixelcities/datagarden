import React, { FC } from 'react'
import { useDrag } from 'react-dnd'

import { useAppDispatch } from 'hooks'
import { createTransformer } from 'state/actions'

import sprites from 'assets/t-sprites.svg'

import './TransformerCard.sass'

interface TransformerCardProps {
  title: string,
  type: string
}

interface Coords {
  x: number,
  y: number
}

const TransformerCard: FC<TransformerCardProps> = ({ title, type }) => {
  const dispatch = useAppDispatch()
  const id = crypto.randomUUID()

  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: "ControlPanel",
      item: { id },
      end: (e, monitor) => {
        const result: Coords = monitor.getDropResult() || {x: 0, y: 0}

        dispatch(createTransformer({
          id: id,
          workspace: "default",
          type: type,
          targets: [],
          position: [result.x, result.y],
          collections: [],
          transformers: [],
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
        ref={dragRef}
        style={{opacity: opacity, cursor: "grab" }}
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

export default TransformerCard
