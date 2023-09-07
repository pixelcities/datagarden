import React, { FC, useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'

import { DataType } from 'types'

import './Dropdown.sass'


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
function Dropdown<T extends Primitive | [Primitive, Primitive] | [string, DataType]>(props: React.PropsWithChildren<DropdownProps<T>>) {
  const {items, onClick, selected, maxWidth, isDropUp = false, isDisabled = false} = props

  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isActive, setIsActive] = useState(false)
  const [dropUp, setDropUp] = useState(isDropUp)
  const [selectedItem, setSelectedItem] = useState<T | null | undefined>(selected)
  const [debounce, setDebounce] = useState(Date.now())
  const [search, setSearch] = useState("")

  const handleActivate = () => {
    if (!isDisabled && Date.now() >= debounce + 100) {
      if (inputRef.current && !isActive) {
        inputRef.current.focus()
      }

      setIsActive(!isActive)
    }
  }

  const handleDeactivate = () => {
    setDebounce(Date.now())
    setIsActive(false)
    setSearch("")

    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const renderItems = React.useMemo(() => {
    const handleSelect = (e: React.MouseEvent<HTMLDivElement>, item: T) => {
      e.preventDefault()

      setSelectedItem(item)
      onClick(item)
      handleDeactivate()
    }

    return items
      .filter(item => {
        const value = Array.isArray(item) ? item[1] : item
        return value.toString().toLowerCase().indexOf(search.toLowerCase()) !== -1
      })
      .map((item, i) => {
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
          <div key={key} tabIndex={0} onMouseDown={(e) => handleSelect(e, item)} className={"dropdown-item" + (equals ? " is-active" : "")} style={style}>
           { value }
          </div>
        )
      })
  }, [ items, selectedItem, onClick, search ])

  // Manage the portal visibility and location
  useEffect(() => {
    if (triggerRef.current && contentRef.current) {
      if (isActive && !isDisabled) {
        const rect = triggerRef.current.getBoundingClientRect()

        if (window.innerHeight - rect.bottom <= 250) {
          setDropUp(true)
          contentRef.current.style.top = `${rect.top - 250 + window.pageYOffset}px`

        } else {
          contentRef.current.style.top = `${rect.bottom + window.pageYOffset}px`
        }

        contentRef.current.style.width = `${rect.width}px`
        contentRef.current.style.left = `${rect.left + window.pageXOffset}px`
        contentRef.current.style.visibility = "visible"

      } else {
        contentRef.current.style.visibility = "hidden"
      }
    }
  }, [ isActive, isDisabled ])

  return (
    <div className={"dropdown" + (isActive && !isDisabled ? " is-active" : "") + (dropUp ? " is-up" : "")} tabIndex={0} onBlur={handleDeactivate}>
      <div ref={triggerRef} className="dropdown-trigger">
        <abbr title={(Array.isArray(selectedItem) ? selectedItem[1] : selectedItem)?.toString()}>
          <div className="button" onClick={handleActivate} aria-haspopup="true" aria-controls="dropdown-menu" style={isDisabled ? {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)", cursor: "default", pointerEvents: "none"} : {maxWidth: "calc(2em + 8.75px + " + maxWidth + "px)"}}>
            <input
              ref={inputRef}
              className="dropdown-input"
              type="text"
              value={search}
              placeholder={Array.isArray(selectedItem) ? selectedItem[1].toString() : selectedItem?.toString()}
              style={{maxInlineSize: maxWidth}}
              onChange={e => { setSearch(e.target.value); setIsActive(true) }}
            />
            <span className="icon is-small">
              <FontAwesomeIcon icon={faAngleDown} size="sm" color={isDisabled ? "#bbb" : "#363636"} />
            </span>
          </div>
        </abbr>
      </div>
      <Portal>
        <div ref={contentRef} className="portal" style={{maxHeight: "250px"}}>
          <div className="dropdown-menu pt-0" id="dropdown-menu" role="menu" style={isActive && !isDisabled ? {display: "block", maxHeight: "inherit", width: "inherit"} : {}}>
            <div className="dropdown-content pt-0" style={{maxHeight: "inherit", overflow: "scroll", width: "inherit", height: dropUp ? "250px" : undefined}}>
              { renderItems }
            </div>
          </div>
        </div>
      </Portal>
    </div>
  )
}

const Portal: FC = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}

export default Dropdown
