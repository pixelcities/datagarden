import React, { FC, useRef, useMemo, useState, useLayoutEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import Dropdown from 'components/Dropdown'
import { DataType } from 'types'


interface ConstraintProps {
  dataType?: DataType,
  rule?: unknown,
  maxWidth?: number
}

interface NumericConstraintProps {
  rule?: unknown,
  onClose: () => void
}

const NumericConstraint: FC<NumericConstraintProps> = ({ onClose }) => {
  const [name, setName] = useState("")
  const [op, setOp] = useState("")
  const [value, setValue] = useState("")

  const handleUpdate = () => {}

  return (
    <div className="modal is-active">
      <div className="modal-background" />

      <div className="modal-content">
        <div className="box">

          <div className="field">
            <label className="label">Name</label>
            <div className="control">
              <input className="input" type="text" style={{borderColor: "#f5f5f5"}} value={name} onChange={(e: any) => setName(e.target.value)} />
            </div>
          </div>

          <div className="field pb-0">
            <label className="label">Rule</label>
          </div>

          <div className="field has-addons is-horizontal pb-0">
            <p className="control my-1 mx-1 pt-1">
              must be
            </p>

            <p className="control my-1 mx-1">
              <span className="select">
                <select onChange={(e: any) => setOp(e.target.value)} value={op}>
                  <option> {"greater than"} </option>
                  <option> {"less than"} </option>
                </select>
              </span>
            </p>

            <p className="control my-1 mx-1">
              <input className="input" type="text" style={{borderColor: "#f5f5f5"}} value={value} onChange={(e: any) => setValue(e.target.value)} />
            </p>
          </div>

          <div className="field is-grouped is-grouped-right">
            <div className="control">
              <input type="submit" className="button is-primary" value="Update" />
            </div>
          </div>
        </div>

      </div>

      <button className="modal-close is-large" aria-label="close" onClick={onClose} />
    </div>
  )
}

const Constraint: FC<ConstraintProps> = ({ dataType, rule }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const name = "My rule"

  const [ready, setReady] = useState(false)
  const [maxWidth, setMaxWidth] = useState<undefined | number>()
  const [modalIsActive, setModalIsActive] = useState(false)

  useLayoutEffect(() => {
    const width = ref.current && Math.floor(ref.current.getBoundingClientRect().width / 5) * 5

    if (width && !ready) {
      setMaxWidth(width)
      setReady(true)
    }

    const interval = setInterval(() => {
      const width = ref.current && Math.floor(ref.current.getBoundingClientRect().width / 5) * 5
      if (width !== maxWidth) {
        setReady(false)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [ ref, ready, maxWidth ])

  const adjustedWidth = useMemo(() => maxWidth && `calc(${maxWidth}px - 1.5rem - 2rem - 1.5rem)`, [ maxWidth ])

  return (
    <>
      { modalIsActive && <NumericConstraint onClose={() => setModalIsActive(false)} /> }

      <div ref={ref}>
        <div className="tags has-addons are-medium is-clickable" style={{flexWrap: "nowrap"}} onClick={() => setModalIsActive(true)}>
         <span className="tag">
            <div className="icon is-small">
              <FontAwesomeIcon icon={faCheck} size="xs"/>
            </div>
          </span>
          <div className="tag is-primary">
            <span style={{display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", maxWidth: adjustedWidth}} >
              <abbr title={name} style={{textDecoration: "none"}}>
              { ready && name }
              </abbr>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Constraint;
