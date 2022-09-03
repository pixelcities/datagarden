import React, { FC, useState } from 'react'
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
  onComplete: any
}

const MergeTransformer: FC<MergeTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, leftSchema, rightSchema, dimensions, setHeaderCallback, onComplete }) => {
  const dispatch = useAppDispatch()

  const [joinType, setJoinType] = useState("LEFT JOIN")
  const [leftColumn, setLeftColumn] = useState<string | null>(null)
  const [rightColumn, setRightColumn] = useState<string | null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext();

  const leftColumns = React.useMemo(() => {
    return leftSchema.columns.map(column => columnNames[column.id])
  }, [ leftSchema, columnNames ])

  const rightColumns = React.useMemo(() => {
    return rightSchema.columns.map(column => columnNames[column.id])
  }, [ rightSchema, columnNames ])

  const handleMerge = React.useCallback((e: any) => {
    e.preventDefault()

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

      dataFusion?.join(tableId, leftId, rightId, query).then((artifacts: string[]) => {
        const leftClone = dataFusion?.clone_table(leftId, "")
        const rightClone = dataFusion?.clone_table(rightId, "")

        dataFusion?.apply_artifact(leftClone, artifacts[0]).then(() => {
          dataFusion?.apply_artifact(rightClone, artifacts[1]).then(() => {
            dataFusion?.append_table(leftClone, rightClone)
            dataFusion?.move_table(leftClone, tableId)

            // Only supports one transaction for now
            setLog({...log, ...{
              identifiers: identifiers,
              transactions: [transaction],
              artifacts: [artifacts.join("|")]
            }})

            onComplete()
          })
        })
      })
    } else {
      console.log("Cannot build query: missing identifier")
    }

  }, [ tableId, leftId, rightId, leftSchema.column_order, rightSchema.column_order, leftColumn, rightColumn, joinType, columnNames, log, dataFusion, onComplete ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))
  }


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleMerge}>

        <div className="field pb-0">
          <label className="label">Join Type</label>
          <Dropdown
            items={["LEFT JOIN", "INNER JOIN", "FULL JOIN"]}
            onClick={(item: string) => setJoinType(item)}
          />
        </div>

        <div className="field pb-0">
          <label className="label">Join Condition</label>
          <Dropdown
            items={leftColumns}
            onClick={(item: string) => setLeftColumn(item)}
          />
          <span className="icon is-small mx-3 mt-3">
            <FontAwesomeIcon icon={faEquals} size="sm"/>
          </span>
          <Dropdown
            items={rightColumns}
            onClick={(item: string) => setRightColumn(item)}
          />
        </div>

        <div className="field is-grouped is-grouped-right pt-0">
          <div className="control">
            <input type="submit" className="button is-text" value="Merge" />
          </div>
        </div>
      </form>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default MergeTransformer
