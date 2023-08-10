import React, { FC, useRef } from 'react'
import { useDrag } from 'react-dnd'

import { useAppDispatch, useAppSelector } from 'hooks'
import { createTransformer, createMetadata } from 'state/actions'
import { selectActiveDataSpace } from 'state/selectors'

import { useKeyStoreContext } from 'contexts'

import sprites from 'assets/t-sprites.svg'
import './TransformerCard.sass'

interface TransformerCardProps {
  title: string,
  type: string,
  tooltip?: string,
  isDisabled?: boolean
}

interface Coords {
  x: number,
  y: number
}

const TransformerCard: FC<TransformerCardProps> = ({ title, type, tooltip, isDisabled }) => {
  const dispatch = useAppDispatch()
  const { keyStore } = useKeyStoreContext();
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const idRef = useRef<{ id: string }>({id: crypto.randomUUID()})

  const onDrag = () => {
    idRef.current.id = crypto.randomUUID()

    return { id: idRef.current }
  }

  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: "ControlPanel",
      item: onDrag,
      end: (e, monitor) => {
        const result: Coords = monitor.getDropResult() || {x: 0, y: 0}

        dispatch(createMetadata({
          id: idRef.current.id,
          workspace: "default",
          metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, `${title} [${new Date().toISOString().split("T")[0]}]`)
        }))

        dispatch(createTransformer({
          id: idRef.current.id,
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
    [ dataSpace?.key_id ]
  )

  return (
    <>
      <div className={"card-block has-tooltip-right " + (tooltip && tooltip.length > 32 ? "has-tooltip-multiline" : "")}
        ref={isDisabled ? null : dragRef}
        style={{opacity: opacity, cursor: (isDisabled ? "default" : "pointer"), backgroundColor: (isDisabled ? "#3c3c3c3d" : "#ffffff")}}
        data-tooltip={tooltip}
      >
        <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
          <use href={sprites + "#" + type} style={{color: "black"}} />
        </svg>

        <p className="card-link has-text-centered" style={title.indexOf(" ") !== -1 ? {marginTop: "-0.5rem"} : {}}>
          { title }
        </p>

      </div>
    </>
  )
}

export default TransformerCard
