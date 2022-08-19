import React, { FC, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEquals } from '@fortawesome/free-solid-svg-icons'


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
  const [joinType, setJoinType] = useState("LEFT JOIN")
  const [leftColumn, setLeftColumn] = useState<string | null>(null)
  const [rightColumn, setRightColumn] = useState<string | null>(null)

  const { dataFusion } = useDataFusionContext();

  const leftColumns = React.useMemo(() => {
    return leftSchema.columns.map(column => columnNames[column.id])
  }, [ leftSchema, columnNames ])

  const rightColumns = React.useMemo(() => {
    return rightSchema.columns.map(column => columnNames[column.id])
  }, [ rightSchema, columnNames ])

  const handleMerge = React.useCallback((e: any) => {
    e.preventDefault()

    const leftColumnId = Object.keys(columnNames).find(id => columnNames[id] === leftColumn)
    const rightColumnId = Object.keys(columnNames).find(id => columnNames[id] === rightColumn)

    const leftSelect = leftSchema.columns.map(column => `"${leftId}"."${column.id}"`)
    const rightSelect = rightSchema.columns.map(column => `"${rightId}"."${column.id}"`)
    const select = [...leftSelect, ...rightSelect].join(", ")

    const query = `SELECT ${select} FROM "${leftId}" ${joinType} "${rightId}" ON "${leftId}"."${leftColumnId}" = "${rightId}"."${rightColumnId}"`

    dataFusion?.query(tableId, leftId, rightId, query).then((artifacts: string[]) => {
      console.log(artifacts)

      onComplete()
    })

  }, [ tableId, leftId, rightId, leftSchema, rightSchema, leftColumn, rightColumn, joinType, columnNames, dataFusion, onComplete ])

  const handleCommit = () => {}


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleMerge}>

        <div className="field pb-0">
          <label className="label">Join Type</label>
          <Dropdown
            items={["LEFT JOIN", "FULL JOIN"]}
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
