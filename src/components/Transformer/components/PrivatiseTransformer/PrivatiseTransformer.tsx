import React, { FC, useMemo, useCallback, useState } from 'react'

import { useAppDispatch } from 'hooks'
import { updateTransformerWAL, sendLocalNotification } from 'state/actions'

import { Schema, Identifier, WAL, ConceptA } from 'types'

import { useDataFusionContext } from 'contexts'

import sprites from 'assets/t-sprites.svg'


interface PrivatiseTransformerProps {
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

const PrivatiseTransformer: FC<PrivatiseTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [columnWeights, setColumnWeights] = useState<{[key: string]: number}>({})
  const [epsilon, setEpsilon] = useState(1)

  const { dataFusion } = useDataFusionContext()

  const onError = useCallback((error: string) => {
    console.log(error)

    dispatch(sendLocalNotification({
      id: crypto.randomUUID(),
      type: "error",
      message: error,
      is_urgent: true,
      is_local: true
    }))
  }, [ dispatch ])

  const handlePrivatise = React.useCallback((e: any) => {
    e.preventDefault()

    if (tableId) {
      const cloneId = dataFusion?.clone_table(tableId, "")

      dataFusion?.synthesize_table(tableId, cloneId, Object.entries(columnWeights), epsilon).then(() => {
        dataFusion?.merge_table(tableId, cloneId)
        // dataFusion?.move_table(cloneId, tableId)
        onComplete()
      })

    } else {
      onError("Cannot build query: missing identifier")
    }

  }, [ tableId, dataFusion, onComplete, onError, columnWeights, epsilon ])

  const handleCommit = () => {
    let identifiers: {[key: string]: Identifier} = {"1": {"id": id, "type": "table"}}
    for (let i = 0; i < schema.column_order.length; i++) {
      identifiers[1+i] = {"id": schema.column_order[i], "type": "column"}
    }

    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: {
        identifiers: identifiers,
        values: {},
        transactions: [],
        artifacts: []
      }
    }))

    onClose()
  }

  const changeWeight = useCallback((column: string, weight: number) => {
    let newWeights = Object.assign({}, columnWeights)

    const nrWeights = Object.keys(columnWeights).length - 1
    const cappedWeight = nrWeights === 0 ? 100 : weight > (100 - nrWeights) ? (100 - nrWeights) : weight
    const diff = columnWeights[column] - cappedWeight

    if (diff !== 0) {
      let total = 0
      const nrWeightsCapped = Object.entries(columnWeights)
        .filter(([k, v]) => k !== column)
        .filter(([k, v]) => v > 1 || diff > 0)
        .length

      Object.entries(columnWeights)
        .filter(([k, v]) => k !== column)
        .forEach(([k, v]) => {
          if (v <= 1 && diff <= 0) {
            newWeights[k] = 1
            total += 1
          } else {
            const value = Math.floor(newWeights[k] + (diff / nrWeightsCapped))

            total += value
            newWeights[k] = value
          }
        })

      newWeights[column] = 100 - total
    }

    setColumnWeights(newWeights)
  }, [ columnWeights ])

  const toggleWeight = useCallback((column: string) => {
    let newWeights = Object.assign({}, columnWeights)

    const diff = columnWeights[column] || 1

    let total = 0
    if (column in columnWeights) {
      delete newWeights[column]

      Object.entries(columnWeights)
        .filter(([k, v]) => k !== column)
        .forEach(([k, v]) => {
          const value = Math.floor(newWeights[k] + (diff / Object.keys(newWeights).length))

          total += value
          newWeights[k] = value
        })

        if (total < 100) {
          const lucky = Object.keys(columnWeights)[0]
          columnWeights[lucky] = columnWeights[lucky] + (100 - total)
        }

    } else {
      const nrOldWeights = Object.keys(columnWeights).length

      Object.entries(columnWeights)
        .forEach(([k, v]) => {
          if (v <= 1) {
            newWeights[k] = 1
            total += 1

          } else {
            const value = Math.floor(newWeights[k] - (diff / nrOldWeights))

            total += value
            newWeights[k] = value
          }
        })

        newWeights[column] = 100 - total
    }

    setColumnWeights(newWeights)
  }, [ columnWeights ])

  const renderColumnWeights = useMemo(() => {
    return Object.keys(columns).map(column => {
      const isActive = column in columnWeights

      return (
        <div key={column} className="pt-3">
          <div className="field has-addons is-horizontal pb-0">
            <span className="px-3" style={{marginTop: "-0.2rem", cursor: "pointer"}} onClick={() => toggleWeight(column)}>
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20}>
                <rect width="20" height="20" rx="5" ry="5" fill="#fff" />
                <use href={sprites + "#privatise"} style={{color: isActive ? "#363636" : "#dbdbdb" }} />
              </svg>
            </span>
            <p className="fineprint-label label-size-2 is-left"> {column} </p>
          </div>

          <div className="field py-0">
            <input className={"slider" + (isActive ? "" : " is-disabled")} type="range" min="1" max="100" value={columnWeights[column] || "50"} onChange={(e: any) => changeWeight(column, Number(e.target.value))} disabled={!isActive} />
          </div>
        </div>
      )
    })
  }, [ columns, columnWeights, toggleWeight, changeWeight ])

  return (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <form onSubmit={handlePrivatise}>
          <div className="field pb-0">
            <label className="label">Privatise</label>
          </div>
          <p className="has-text-justified">
            Generate a synthesized dataset that no longer contains the original data, so that it can be shared with your collaborators.
          </p>

          <div className="field pb-0">
            <label className="label">Epsilon</label>
            <div className="control">
              <input className="input" value={epsilon} onChange={(e: any) => setEpsilon(e.target.value)} />
            </div>
          </div>

          <div className="field pb-0">
            <label className="label">Budget</label>
              { renderColumnWeights }
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Privatise" />
            </div>
          </div>
        </form>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default PrivatiseTransformer
