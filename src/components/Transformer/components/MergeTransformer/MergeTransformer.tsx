import React, { FC, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEquals } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch } from 'hooks'
import { updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL, ConceptA } from 'types'
import { getIdentifiers } from 'utils/query'

import { useDataFusionContext } from 'contexts'


interface MergeTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columns: {[key: string]: ConceptA},
  leftSchema: Schema,
  rightSchema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const MergeTransformer: FC<MergeTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, leftSchema, rightSchema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [joinType, setJoinType] = useState("LEFT JOIN")
  const [leftColumn, setLeftColumn] = useState<[string, string] | null>(null)
  const [rightColumn, setRightColumn] = useState<[string, string] | null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext();

  const leftColumns: [string, string][] = React.useMemo(() => {
    return leftSchema.columns.map(column => [column.id, columns[column.id]?.name])
  }, [ leftSchema, columns ])

  const rightColumns: [string, string][] = React.useMemo(() => {
    return rightSchema.columns.map(column => [column.id, columns[column.id]?.name])
  }, [ rightSchema, columns ])

  // Rebuild state
  useEffect(() => {
    if (leftId && rightId && startup && wal && wal.transactions.length > 0) {
      for (const match of wal.transactions[0].matchAll(/FROM +(?:[[0-9I%$]+) +([A-Z ]+) +(?:[[0-9I%$]+) +ON +([[0-9I%$]+) += +([[0-9I%$]+)/g)) {
        if (match[1] && match[2] && match[3]) {
          const maybeLeftId = Number(match[2].match(/%([0-9]+)\$I/)![1])
          const leftColumnId = wal.identifiers[maybeLeftId]?.id
          const leftColumnName = columns[leftColumnId]?.name

          const maybeRightId: number = Number(match[3].match(/%([0-9]+)\$I/)![1])
          const rightColumnId = wal.identifiers[maybeRightId]?.id
          const rightColumnName = columns[rightColumnId]?.name

          if (leftColumnName && rightColumnName) {
            setJoinType(match[1])
            setLeftColumn([leftColumnId, leftColumnName])
            setRightColumn([rightColumnId, rightColumnName])
          }
        }
      }

      setStartup(false)
      setReplay(true)
    }
  }, [ leftId, rightId, startup, wal, columns ])

  const execute = React.useCallback(async () => {
    if (leftId && rightId && leftColumn && rightColumn) {
      const leftColumnId = leftColumn[0]
      const rightColumnId = rightColumn[0]

      const { identifiers, ids } = getIdentifiers(log.identifiers, [leftId, rightId], [leftColumnId, rightColumnId])

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

  }, [ tableId, leftId, rightId, leftColumn, rightColumn, joinType, log, dataFusion, onComplete ])

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
              onClick={item => setJoinType(item)}
              selected={joinType}
            />
          </div>

          <div className="field pb-0">
            <label className="label">Join Condition</label>
            <Dropdown
              key={"dropdown-left-" + (leftColumn !== null).toString()}
              items={leftColumns}
              maxWidth={145}
              onClick={item => setLeftColumn(item)}
              selected={leftColumn}
            />
            <span className="icon is-small mx-3 mt-3">
              <FontAwesomeIcon icon={faEquals} size="sm"/>
            </span>
            <Dropdown
              key={"dropdown-right-" + (rightColumn !== null).toString()}
              items={rightColumns}
              maxWidth={145}
              onClick={item => setRightColumn(item)}
              selected={rightColumn}
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
