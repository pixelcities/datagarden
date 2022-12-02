import React, { FC, useState } from 'react'

import { useAppDispatch } from 'hooks'
import { deletePage } from 'state/actions'

import HoverButton from 'components/HoverButton'


interface ReportCardProps {
  id: string,
  title: string,
  type: string,
  onClick?: any
}

const preview = (
  <g>
    <rect x="20" y="40" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="60" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="80" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="100" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="120" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="140" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="160" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="180" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="200" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="220" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="240" width="180" height="2" fill="#dbdbdb" />
    <rect x="20" y="260" width="180" height="2" fill="#dbdbdb" />
  </g>
)

const add = (
  <g transform="translate(0 53.5)">
    <path d="M131.562 97.6875H112.812V78.9375C112.812 78.4688 112.344 78 111.875 78H108.125C107.539 78 107.188 78.4688 107.188 78.9375V97.6875H88.4375C87.8516 97.6875 87.5 98.1562 87.5 98.625V102.375C87.5 102.961 87.8516 103.312 88.4375 103.312H107.188V122.062C107.188 122.648 107.539 123 108.125 123H111.875C112.344 123 112.812 122.648 112.812 122.062V103.312H131.562C132.031 103.312 132.5 102.961 132.5 102.375V98.625C132.5 98.1562 132.031 97.6875 131.562 97.6875Z" fill="#F8CD30"/>
  </g>
)


const cardWithPreview = (type: string) => {
  let img

  switch(type) {
    case "preview":
      img = preview
      break

    case "add":
      img = add
      break
  }

  return (
    <svg width="220" height="311" viewBox="0 0 220 311" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d)">
        <rect x="2" width="216" height="305" rx="2" fill="white"/>
        <rect x="2.5" y="0.5" width="215" height="304" rx="1.5" stroke="#EAEAEA"/>
      </g>

      { img }

      <defs>
        <filter id="filter0_d" x="0" y="0" width="220" height="311" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
}


const ReportCard: FC<ReportCardProps> = (props) => {
  const dispatch = useAppDispatch()

  const [ showButton, setShowButton ] = useState(false)
  const title = props.title

  const handleDelete = () => {
    dispatch(deletePage({
      id: props.id,
      workspace: "default"
    }))
  }

  return (
    <div className="is-relative">
      <div onMouseEnter={() => setShowButton(true)} onMouseLeave={() => setShowButton(false)}>

        <div style={{position: "absolute", top: "-1rem", width: "100%", zIndex: 999}}>
          <div className="is-flex is-justify-content-flex-end pr-2">
            <HoverButton isActive={showButton && props.type !== "add"} type="delete" onClick={handleDelete} />
          </div>
        </div>

        <div id={props.id ?? title} onClick={props.onClick} style={{width: 216}}>
          <div style={{cursor: "pointer", position: "relative", width: "220", height: "204"}}>
            { cardWithPreview(props.type) }
          </div>

          <p className="header-label pl-2 pt-1" style={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", wordWrap: "break-word"}} > { title } </p>
        </div>

      </div>
    </div>
  )
}

export default ReportCard
