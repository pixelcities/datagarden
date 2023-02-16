import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

interface DropdownProps<T> {
  items: T[],
  onClick: (item: T) => void,
  selected?: T | null,
  maxWidth?: number,
  isDropUp?: boolean,
  isDisabled?: boolean
}

type Primitive = string | number | boolean

/*
 * Dropdown with callback
 *
 * Accepts primitive types as the dropdown items, or tuples of [T, T] where the first value is an identifier
 * and the second value is the printable text.
 */
function Dropdown<T extends Primitive | [Primitive, Primitive]>(props: React.PropsWithChildren<DropdownProps<T>>) {
  const {items, onClick, selected, maxWidth, isDropUp = false, isDisabled = false} = props

  const [isActive, setIsActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null | undefined>(selected)

  const renderItems = React.useMemo(() => {
    const handleSelect = (e: React.MouseEvent<HTMLDivElement>, item: T) => {
      e.preventDefault()

      setSelectedItem(item)
      setIsActive(false)
      onClick(item)
    }

    return items.map((item, i) => {
      let key, value, equals

      if (Array.isArray(item)) {
        key = item[0] as string
        value = item[1]
        equals = selectedItem && Array.isArray(selectedItem) && selectedItem[0] === item[0]

      } else {
        key = item as string
        value = item
        equals = selectedItem === item
      }

      const style = {
        cursor: "pointer",
        backgroundColor: equals ? "#f7f7f7" : "#ffffff"
      }

      return (
        <div key={key} onClick={(e) => handleSelect(e, item)} className={"dropdown-item" + (equals ? " is-active" : "")} style={style}>
         { value }
        </div>
      )
    })
  }, [ items, selectedItem, onClick ])

  return (
    <div className={"dropdown" + (isActive && !isDisabled ? " is-active" : "") + (isDropUp ? " is-up" : "")}>
      <div className="dropdown-trigger">
        <div className="button" onClick={() => setIsActive(!isActive && !isDisabled)} aria-haspopup="true" aria-controls="dropdown-menu" style={isDisabled ? {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)", cursor: "default", pointerEvents: "none"} : {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)"}}>
          <span style={{minWidth: 50, maxInlineSize: maxWidth, overflow: "clip"}}> { Array.isArray(selectedItem) ? selectedItem[1] : selectedItem } </span>
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
