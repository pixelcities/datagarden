import React, { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTimes, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons'


interface HoverButtonProps {
  type: string,
  isActive?: boolean,
  onClick?: () => void
}

const HoverButton: FC<HoverButtonProps> = ({ type, isActive, onClick }) => {
  let icon = faPlus
  let padding = "0rem"

  if (isActive !== undefined && !isActive) {
    return (
      <></>
    )
  }

  switch(type) {
    case "edit":
      icon = faEdit
      padding = "0.25rem"
      break

    case "close":
      icon = faTimes
      break

    case "save":
      icon = faCheck
      break

    case "delete":
      icon = faTrash
      break

    default:
      icon = faPlus
  }

  return (
    <button className="hover-button is-small" onClick={onClick}>
      <span className="icon is-small" style={{paddingLeft: padding}}>
        <FontAwesomeIcon icon={icon} size="sm"/>
      </span>
    </button>
  )
}

export default HoverButton;
