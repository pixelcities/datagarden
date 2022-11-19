import React, { FC, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectConceptMap, selectActiveDataSpace } from 'state/selectors'
import { updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL } from 'types'

import { useDataFusionContext } from 'contexts'
import { emptyTaxonomy } from 'utils/taxonomy'


interface AggregateTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columnNames: {[key: string]: string},
  schema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any
}

const AggregateTransformer: FC<AggregateTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete }) => {
  const dispatch = useAppDispatch()

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [columns, addColumn] = useState<(string | null)[]>([null])
  const [aggregateFns, addAggregateFn] = useState<string[]>(["SUM"])
  const [groupClauses, addGroupClause] = useState<(string | null)[]>([])
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext()

  const handleAggregate = React.useCallback((e: any) => {
    e.preventDefault()

    const columnIds = columns.map(column => Object.entries(columnNames).find(([a, b]) => b === column)).filter((x): x is [string, string] => !!x).map(x => x[0])
    const groupIds = groupClauses.map(group => Object.entries(columnNames).find(([a, b]) => b === group)).filter((x): x is [string, string] => !!x).map(x => x[0])

    // Datafusion does not like having the group clause as an aggregate
    if (groupIds.filter(group => columnIds.indexOf(group) !== -1).length > 0) {
      console.log("Error: group clauses should not be part of the aggregate expressions")
      return
    }

    if (tableId) {
      // Check if the identifiers need to be added to the log
      const missingIdentifiers = [tableId, ...columnIds, ...groupIds].filter(i => Object.values(log.identifiers).indexOf(i) === -1)
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
      const groupIdClauses = groupIds.map((groupId, i) => `%${ids[groupId]}$I`)
      const groupNameClauses = groupIds.map((groupId, i) => `"${groupId}"`)
      const groupBy = (groupIds.length > 0) ? "GROUP BY" : ""

      const selectIdClauses = [...groupIdClauses, ...columnIds.map((columnId, i) => `${aggregateFns[i]}(%${ids[columnId]}$I) AS %${ids[columnId]}$I`)]
      const selectNameClauses = [...groupNameClauses, ...columnIds.map((columnId, i) => `${aggregateFns[i]}("${columnId}") AS "${columnId}"`)]

      const transaction = `SELECT ${selectIdClauses.join(",")} FROM %${ids[tableId]}$I ${groupBy} ${groupIdClauses.join(",")}`
      const query = `SELECT ${selectNameClauses.join(",")} FROM "${tableId}" ${groupBy} ${groupNameClauses.join(",")}`

      // Update schema to include aggregate function metadata
      const arrow_schema = dataFusion?.get_schema(tableId)
      const fields = arrow_schema.fields.map((field: any) => {
        // The active fields should receive the selected aggregateFn
        const index = columnIds.indexOf(field.name)
        if (index !== -1) {
          return {...field, ...{
            metadata: {
              aggregate_fn: aggregateFns[index].toLowerCase()
            }
          }}

        // The others will inherit the aggregateFn from their concept
        } else {
          const fullColumn = schema.columns.find(column => field.name === column.id)
          const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[fullColumn?.concept_id ?? ""])
          const defaultAggregateFn = maybe_concept ? maybe_concept.aggregateFn : "array_agg"

          return {...field, ...{
            metadata: {
              aggregate_fn: defaultAggregateFn
            }
          }}
        }
      })

      dataFusion?.update_schema(tableId, {...arrow_schema, ...{fields: fields}})

      const cloneId = dataFusion?.clone_table(tableId, "")

      dataFusion?.query(tableId, query).then((artifact: string) => {
        const resultSchema = dataFusion?.get_schema(tableId)
        const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

        const done = new Promise<void>((resolve, reject) => {
          // Verify all the columns are present
          if (schema.column_order.filter(column => resultColumns.indexOf(column) === -1).length === 0) {
            dataFusion?.drop_table(cloneId)
            resolve()

          // If not, apply the artifact and merge the results
          } else {
            dataFusion?.apply_artifact(cloneId, artifact).then(() => {
              dataFusion?.merge_table(cloneId, tableId)
              dataFusion?.move_table(cloneId, tableId)
              resolve()
            })
          }
        })

        done.then(() => {
          setLog({...log, ...{
            identifiers: identifiers,
            transactions: [transaction],
            artifacts: [artifact]
          }})

          onComplete()
        })
      })
    } else {
      console.log("Cannot build query: missing identifier")
    }

  }, [ tableId, schema, columns, columnNames, log, dataFusion, dataSpace, concepts, aggregateFns, groupClauses, onComplete ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))
  }

  const columnSelection = React.useMemo(() => {
    return columns.map((column, i) => {
      return (
        <div key={"column" + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={["SUM", "AVG", "MIN", "MAX"]}
            onClick={(item: string) => addAggregateFn(aggregateFns.map((x, j) => i === j ? item : x))}
          />

          <span className="is-size-4 has-text-weight-bold px-2"> ( </span>
          <Dropdown
            items={Object.values(columnNames).filter((x) => columns.indexOf(x) === -1)}
            onClick={(item: string) => addColumn(columns.map((x, j) => i === j ? item : x))}
          />
          <span className="is-size-4 has-text-weight-bold px-2"> ) </span>
        </div>
      )
    })
  }, [ columns, columnNames, aggregateFns, addAggregateFn, addColumn ])

  const handleAddColumn = (e: any) => {
    e.preventDefault()

    addColumn([...columns, null])
    addAggregateFn([...aggregateFns, "SUM"])
  }

  const groupSelection = React.useMemo(() => {
    return groupClauses.map((group, i) => {
      return (
        <div key={"column" + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={Object.values(columnNames)}
            onClick={(item: string) => addGroupClause(groupClauses.map((x, j) => i === j ? item : x))}
          />

          { (i !== groupClauses.length -1) ?
            <span className="is-size-4 has-text-weight-bold px-2 pt-2"> , </span>
            : null
          }

        </div>
      )
    })
  }, [ columnNames, groupClauses, addGroupClause ])

  const handleAddGroupClause = (e: any) => {
    e.preventDefault()

    addGroupClause([...groupClauses, null])
  }


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleAggregate}>
        <div className="field pb-0">
          <button className="plus-button is-right is-small" onClick={handleAddColumn}>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faPlus} size="sm"/>
            </span>
          </button>
          <label className="label">Aggregate Columns</label>
        </div>

        { columnSelection }

        <div className="field pb-0">
          <button className="plus-button is-right is-small" onClick={handleAddGroupClause}>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faPlus} size="sm"/>
            </span>
          </button>
          <label className="label">Group By</label>
        </div>

        { groupSelection }

        <div className="field is-grouped is-grouped-right pt-0">
          <div className="control">
            <input type="submit" className="button is-text" value="Aggregate" />
          </div>
        </div>
      </form>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default AggregateTransformer
