import React, { FC, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEquals } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch } from 'hooks'
import { updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL } from 'types'

import { useDataFusionContext } from 'contexts'


interface MergeTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columnNames: {[key: string]: string},
  leftSchema: Schema,
  rightSchema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const MergeTransformer: FC<MergeTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, leftSchema, rightSchema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [joinType, setJoinType] = useState("LEFT JOIN")
  const [leftColumn, setLeftColumn] = useState<string | null>(null)
  const [rightColumn, setRightColumn] = useState<string | null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext();

  const leftColumns = React.useMemo(() => {
    return leftSchema.columns.map(column => columnNames[column.id])
  }, [ leftSchema, columnNames ])

  const rightColumns = React.useMemo(() => {
    return rightSchema.columns.map(column => columnNames[column.id])
  }, [ rightSchema, columnNames ])

  // Rebuild state
  useEffect(() => {
    if (leftId && rightId && startup && wal && wal.transactions.length > 0) {
      for (const match of wal.transactions[0].matchAll(/FROM +(?:[[0-9I%$]+) +([A-Z ]+) +(?:[[0-9I%$]+) +ON +([[0-9I%$]+) += +([[0-9I%$]+)/g)) {
        if (match[1] && match[2] && match[3]) {
          const maybeLeftId = Number(match[2].match(/%([0-9]+)\$I/)![1])
          const leftColumnId = wal.identifiers[maybeLeftId]
          const leftColumnName = columnNames[leftColumnId]

          const maybeRightId = Number(match[3].match(/%([0-9]+)\$I/)![1])
          const rightColumnId = wal.identifiers[maybeRightId]
          const rightColumnName = columnNames[rightColumnId]

          if (leftColumnName && rightColumnName) {
            setJoinType(match[1])
            setLeftColumn(leftColumnName)
            setRightColumn(rightColumnName)
          }
        }
      }

      setStartup(false)
      setReplay(true)
    }
  }, [ leftId, rightId, startup, wal, columnNames ])

  const execute = React.useCallback(async () => {
    const leftColumnId = Object.keys(columnNames).find(id => leftSchema.column_order.indexOf(id) !== -1 && columnNames[id] === leftColumn)
    const rightColumnId = Object.keys(columnNames).find(id => rightSchema.column_order.indexOf(id) !== -1 && columnNames[id] === rightColumn)

    if (leftId && rightId && leftColumnId && rightColumnId) {
      // Check if the identifiers need to be added to the log
      const missingIdentifiers = [leftId, rightId, leftColumnId, rightColumnId].filter(i => Object.values(log.identifiers).indexOf(i) === -1)
      const nextId = Object.keys(log.identifiers).length ? Math.max(...Object.keys(log.identifiers).map(Number)) + 1 : 1

      // Add the missing identifiers
      let identifiers: {[key: string]: string} = JSON.parse(JSON.stringify(log.identifiers))
      for (let i = 0; i < missingIdentifiers.length; i++) {
        identifiers[nextId + i] = missingIdentifiers[i]
      }

      // Invert the map for easy access
      let ids: {[key: string]: string} = {}
      Object.entries(identifiers).forEach(([i, id]) => ids[id] = i)

      // Build a proper transaction to be saved, and a query for the preview
      const transaction = `SELECT %${ids[leftColumnId]}$I, %${ids[rightColumnId]}$I FROM %${ids[leftId]}$I ${joinType} %${ids[rightId]}$I ON %${ids[leftColumnId]}$I = %${ids[rightColumnId]}$I ORDER BY 1, 2`
      const query = `SELECT "${leftColumnId}", "${rightColumnId}" FROM "${leftId}" ${joinType} "${rightId}" ON "${leftColumnId}" = "${rightColumnId}" ORDER BY 1, 2`

      const artifacts: string[] = await dataFusion?.join(tableId, leftId, rightId, query)
      const leftClone = dataFusion?.clone_table(leftId, "")
      const rightClone = dataFusion?.clone_table(rightId, "")

      await dataFusion?.apply_artifact(leftClone, artifacts[0])
      await dataFusion?.apply_artifact(rightClone, artifacts[1])
      dataFusion?.append_table(leftClone, rightClone)
      dataFusion?.move_table(leftClone, tableId)

      onComplete()

      return {
        identifiers: identifiers,
        transactions: [transaction],
        artifacts: [artifacts.join("|")],
        values: {}
      }
    } else {
      throw new Error("Cannot build query: missing identifier")
    }

  }, [ tableId, leftId, rightId, leftSchema.column_order, rightSchema.column_order, leftColumn, rightColumn, joinType, columnNames, log, dataFusion, onComplete ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && leftColumn && rightColumn) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => console.log(e))
    }
  }, [ leftId, tableId, replay, leftColumn, rightColumn, execute, dataFusion ])

  const handleMerge = React.useCallback((e: any) => {
    e.preventDefault()

    dataFusion?.clone_table(leftId, tableId)
    execute()
      .then((result) => {
        setLog(result)
      })
      .catch((e) => console.log(e))
  }, [ leftId, tableId, execute, setLog, dataFusion ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))

    onClose()
  }

  if (!tableId) {
    return (
      <div className="is-relative px-4 py-4" style={{height: "100%"}}>
        <progress className="progress is-small is-primary" style={{marginTop: "50%"}} />
      </div>
    )
  }

  return (
    <div className="control-body px-4 py-4">
      <div className="control-settings">
        <form onSubmit={handleMerge}>

          <div className="field pb-0">
            <label className="label">Join Type</label>
            <Dropdown
              key={joinType}
              items={["LEFT JOIN", "INNER JOIN", "FULL JOIN"]}
              maxWidth={200}
              onClick={(item: string) => setJoinType(item)}
              selected={joinType}
            />
          </div>

          <div className="field pb-0">
            <label className="label">Join Condition</label>
            <Dropdown
              key={"left" + leftColumn}
              items={leftColumns}
              maxWidth={145}
              onClick={(item: string) => setLeftColumn(item)}
              selected={leftColumn !== null ? leftColumn : undefined}
            />
            <span className="icon is-small mx-3 mt-3">
              <FontAwesomeIcon icon={faEquals} size="sm"/>
            </span>
            <Dropdown
              key={"right" + rightColumn}
              items={rightColumns}
              maxWidth={145}
              onClick={(item: string) => setRightColumn(item)}
              selected={rightColumn !== null ? rightColumn : undefined}
            />
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Merge" />
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

export default MergeTransformer
