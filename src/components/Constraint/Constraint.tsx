import React, { FC, useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import { DataType, NumericOperator, Rule } from 'types'


interface ConstraintProps {
  conceptName: string,
  dataType?: DataType,
  rule?: Rule,
  onChange: (rule: Rule) => void,
  onDelete: () => void
}

interface NumericConstraintProps {
  conceptName: string,
  rule?: Rule,
  onChange: (rule: Rule) => void,
  onDelete: () => void,
  onClose: () => void
}

const NumericConstraint: FC<NumericConstraintProps> = ({ conceptName, rule, onChange, onDelete, onClose }) => {
  const [name, setName] = useState(rule?.name || "")
  const [op, setOp] = useState<NumericOperator>(rule?.operator || "IS NOT NULL")
  const [value, setValue] = useState<string>((rule?.values && rule.values.length > 0) ? rule.values[0] : "")

  useEffect(() => {
    if (op === "IS NOT NULL") {
      setValue("")
    }
  }, [ op ])

  const handleUpdate = () => {
    const values = (value !== "") ? [value] : []

    onChange({
      name: name,
      operator: op,
      values: values,
      condition: [op, ...values].join(" ")
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

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
              <span className="is-italic"> { conceptName } </span> must
            </p>

            <p className="control my-1 mx-1">
              <span className="select">
                <select onChange={(e: any) => setOp(e.target.value)} value={op}>
                  <option value={"IS NOT NULL"}> {"not be empty"} </option>
                  <option value={">"}> {"be greater than"} </option>
                  <option value={">="}> {"be greater than or equal to"} </option>
                  <option value={"<"}> {"be less than"} </option>
                  <option value={"<="}> {"be less than or equal to"} </option>
                </select>
              </span>
            </p>

            { op !== "IS NOT NULL" &&
              <p className="control my-1 mx-1">
                <input className="input" type="text" style={{borderColor: "#f5f5f5"}} value={value} onChange={(e: any) => setValue(e.target.value)} />
              </p>
            }
          </div>

          <div className="field is-grouped is-grouped-right">
            <div className="control buttons">
              <div className="button is-danger" onClick={handleDelete}> Delete </div>
              <div className="button is-primary" onClick={handleUpdate}> Update </div>
            </div>
          </div>
        </div>

      </div>

      <button className="modal-close is-large" aria-label="close" onClick={onClose} />
    </div>
  )
}

const Constraint: FC<ConstraintProps> = ({ conceptName, dataType, rule, onChange, onDelete }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const name = rule?.name || "My rule"

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
      { modalIsActive && <NumericConstraint conceptName={conceptName} rule={rule} onChange={onChange} onClose={() => setModalIsActive(false)} onDelete={onDelete} /> }

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
