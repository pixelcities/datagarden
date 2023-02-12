import React, { FC, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

interface DropdownProps {
  items: string[],
  onClick: (item: string) => void,
  selected?: string,
  maxWidth?: number,
  isDropUp?: boolean,
  isDisabled?: boolean
}

const Dropdown: FC<DropdownProps> = ({items, onClick, selected, maxWidth, isDropUp = false, isDisabled = false}) => {
  const [isActive, setIsActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | undefined>(selected)

  const renderItems = React.useMemo(() => {
    const handleSelect = (e: React.MouseEvent<HTMLDivElement>, item: string) => {
      e.preventDefault()

      setSelectedItem(item)
      setIsActive(false)
      onClick(item)
    }

    return items.map((item, i) => {
      const style = {
        cursor: "pointer",
        backgroundColor: selectedItem === item ? "#f7f7f7" : "#ffffff"
      }

      return (
        <div key={item + i} onClick={(e) => handleSelect(e, item)} className={"dropdown-item" + (selectedItem === item ? " is-active" : "")} style={style}>
         { item }
        </div>
      )
    })
  }, [ items, selectedItem, onClick ])

  return (
    <div className={"dropdown" + (isActive && !isDisabled ? " is-active" : "") + (isDropUp ? " is-up" : "")}>
      <div className="dropdown-trigger">
        <div className="button" onClick={() => setIsActive(!isActive && !isDisabled)} aria-haspopup="true" aria-controls="dropdown-menu" style={isDisabled ? {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)", cursor: "default", pointerEvents: "none"} : {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)"}}>
          <span style={{minWidth: 50, maxInlineSize: maxWidth, overflow: "clip"}}> { selectedItem } </span>
          <span className="icon is-small">
            <FontAwesomeIcon icon={faAngleDown} size="sm" color={isDisabled ? "#bbb" : "#363636"} />
          </span>
        </div>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content">
          { renderItems }
        </div>
      </div>
    </div>
  )
}

export default Dropdown
