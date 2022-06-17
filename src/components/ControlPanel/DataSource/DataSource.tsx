import React, { FC } from 'react'
import ReactDOMServer from 'react-dom/server'
import { useDrag, DragPreviewImage } from 'react-dnd'

import { Source } from 'types'
import { useAppDispatch } from 'hooks'
import { createCollection } from 'state/actions'

interface DataSourceProps {
  source: Source,
  title: string,
  color: string
}

interface Coords {
  x: number,
  y: number
}

const genSourcePreview = (color: string) => {
  const svg = (
    <svg width="124" height="92" viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d)">
        <rect x="2" width="120" height="60" rx="2" fill={color}/>
        <rect x="2.5" y="0.5" width="119" height="59" rx="1.5" stroke="#EAEAEA"/>
      </g>
      <path d="M19.5312 8.0625L16.9375 5.46875C16.6562 5.1875 16.25 5 15.875 5H9.46875C8.65625 5.03125 8 5.6875 8 6.53125V19.5312C8 20.3438 8.65625 21 9.46875 21H18.5C19.3125 21 20 20.3438 20 19.5312V9.125C20 8.75 19.8125 8.34375 19.5312 8.0625ZM16 6.03125C16.0625 6.0625 16.1562 6.09375 16.2188 6.15625L18.8438 8.78125C18.9062 8.84375 18.9375 8.9375 18.9688 9.03125H16V6.03125ZM19 19.5312C19 19.7812 18.75 20.0312 18.5 20.0312H9.46875C9.21875 20.0312 8.96875 19.7812 8.96875 19.5312V6.53125C8.96875 6.25 9.21875 6 9.46875 6H15V9.28125C15 9.6875 15.3125 10 15.75 10H19V19.5312ZM10 11.5V18.5C10 18.7812 10.2188 19 10.5 19H17.5C17.75 19 18 18.7812 18 18.5V11.5C18 11.25 17.75 11 17.5 11H10.5C10.2188 11 10 11.25 10 11.5ZM17 18H14.5V16.5H17V18ZM17 15.5H14.5V14H17V15.5ZM11 12H17V13H11V12ZM11 14H13.5V15.5H11V14ZM11 16.5H13.5V18H11V16.5Z" fill="#363636"/>
      <defs>
        <filter id="filter0_d" x="0" y="0" width="124" height="64" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
          <feOffset dy="2"/>
          <feGaussianBlur stdDeviation="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
      </defs>
    </svg>
  )

  return "data:image/svg+xml," + encodeURIComponent(ReactDOMServer.renderToString(svg))
}


const DataSource: FC<DataSourceProps> = ({ source, title, color }) => {
  const dispatch = useAppDispatch()

  const sourcePreview = genSourcePreview(color)
  const [{ opacity }, dragRef, preview] = useDrag(
    () => ({
      type: "ControlPanel",
      item: { source },
      end: (e, monitor) => {
        const result: Coords = monitor.getDropResult() || {x: 0, y: 0}
        const schema = {...JSON.parse(JSON.stringify(source.schema)), ...{id: crypto.randomUUID()}}
        const payload = {
          id: source.id,
          type: "source",
          workspace: "default",
          uri: source.uri ?? "",
          schema: schema,
          targets: [],
          position: [
            result.x,
            result.y
          ],
          color: color,
          is_ready: true
        }
        dispatch(createCollection(payload))
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1
      })
    }),
    []
  )

  return (
    <>
      <DragPreviewImage connect={preview} src={sourcePreview} />

      <svg style={{marginRight: "1rem"}} width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill={color}/>
      </svg>

      <div
        ref={dragRef}
        style={{opacity: opacity, cursor: "grab" }}
      >
        <p className="subtitle is-6">
          { title.length > 20 ? title.slice(0, 20) + "..." : title }
        </p>
      </div>
    </>
  )
}

export default DataSource
