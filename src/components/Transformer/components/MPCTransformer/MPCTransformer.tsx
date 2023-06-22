import React, { FC, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch } from 'hooks'
import { createMPC, updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, Identifier, WAL, ConceptA } from 'types'
import { useKeyStoreContext } from 'contexts'


interface MPCTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columns: {[key: string]: ConceptA},
  schema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const MPCTransformer: FC<MPCTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [selectedColumns, setSelectedColumns] = useState<([string, string] | null)[]>([null, null, null])
  const [outputColumn, setOutputColumn] = useState<([string, string] | null)>(null)
  const [isDisabled, setIsDisabled] = useState(true)

  const { keyStore } = useKeyStoreContext()

  const columnNames: [string, string][] = useMemo(() => Object.entries(columns).map(([id, concept]) => [id, concept.name]), [ columns ])

  const handleCommit = () => {
    const cols = [...selectedColumns.map(x => x![0]), outputColumn![0]]

    let identifiers: {[key: string]: Identifier} = {"1": {"id": id, "type": "table"}}
    for (let i = 0; i < cols.length; i++) {
      identifiers[1+i] = {"id": cols[i], "type": "column"}
    }

    const data = keyStore?.encrypt_metadata(schema.key_id, JSON.stringify({
      selected: selectedColumns.map(x => x![0]),
      output: outputColumn![0],
      secret: Math.random() * 1000000
    }))

    dispatch(createMPC({
      id: id,
      nr_parties: selectedColumns.length
    }))

    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: {
        identifiers: identifiers,
        values: {},
        transactions: [],
        artifacts: [],
        data: data
      }
    }))

    onClose()
  }

  useEffect(() => {
    if (outputColumn !== null && selectedColumns.filter(x => x === null).length === 0) {
      setIsDisabled(false)
    }
  }, [ selectedColumns, outputColumn ])


  const columnSelection = React.useMemo(() => {
    return selectedColumns.map((column, i) => {
      return (
        <div key={"columnselection" + (column !== null) + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={columnNames}
            maxWidth={110}
            onClick={item => setSelectedColumns(selectedColumns.map((x, j) => i === j ? item : x)) }
            selected={column}
          />
        </div>
      )
    })
  }, [ selectedColumns, columnNames, setSelectedColumns ])

  const handleAddColumn = (e: any) => {
    e.preventDefault()

    setSelectedColumns([...selectedColumns, null])
  }

  const handleDelColumn = (e: any) => {
    e.preventDefault()

    if (selectedColumns.length > 3) {
      setSelectedColumns(selectedColumns.slice(0, -1))
    }
  }

  return (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <div>
          <div className="field pb-0">
            <div className="hover-buttons is-right">
              <button className="hover-button is-small" onClick={handleDelColumn}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faMinus} size="sm"/>
                </span>
              </button>
              <button className="hover-button is-small" onClick={handleAddColumn}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faPlus} size="sm"/>
                </span>
              </button>
            </div>
            <label className="label">Input Columns</label>
          </div>

          { columnSelection }

          <div className="field pb-0">
            <label className="label">Output Column</label>

            <Dropdown
              items={columnNames}
              maxWidth={110}
              onClick={item => setOutputColumn(item)}
              selected={outputColumn}
            />
          </div>

        </div>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit} disabled={isDisabled}> Compute Secure Sum </button>
      </div>
    </div>
  )
}

export default MPCTransformer
