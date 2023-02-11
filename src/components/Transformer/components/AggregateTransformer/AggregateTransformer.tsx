import React, { FC, useEffect, useState } from 'react'
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
  onComplete: any,
  onClose: any
}

const AggregateTransformer: FC<AggregateTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [columns, addColumn] = useState<(string | null)[]>([null])
  const [aggregateFns, addAggregateFn] = useState<string[]>(["SUM"])
  const [groupClauses, addGroupClause] = useState<(string | null)[]>([])
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext()

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && wal && wal.transactions.length > 0) {
      // Crudely parse the transaction to display human friendly history. This is
      // just used for visualization purposes when visiting old transformers.
      let aggregates = []
      let selectNames = []
      let groupClauses = []

      for (const match of wal.transactions[0].matchAll(/([A-Z]+)\(([[0-9I%$]+)\)/g)) {
        if (match[1] && match[2]) {
          const id = Number(match[2].match(/%([0-9]+)\$I/)![1])
          const columnId = wal.identifiers[id]
          const columnName = columnNames[columnId]

          if (columnName) {
            aggregates.push(match[1])
            selectNames.push(columnName)
          }
        }
      }

      for (const match of wal.transactions[0].split("GROUP BY")[1].matchAll(/ *%([0-9]+)\$I/g)) {
        if (match[1]) {
          const columnId = wal.identifiers[Number(match[1])]
          const columnName = columnNames[columnId]

          if (columnName) {
            groupClauses.push(columnName)
          }
        }
      }

      addAggregateFn(aggregates)
      addColumn(selectNames)
      addGroupClause(groupClauses)

      setStartup(false)
      setReplay(true)
    }
  }, [ tableId, startup, wal, columnNames ])

  const execute = React.useCallback(async () => {
    const columnIds = columns.map(column => Object.entries(columnNames).find(([a, b]) => b === column)).filter((x): x is [string, string] => !!x).map(x => x[0])
    const groupIds = groupClauses.map(group => Object.entries(columnNames).find(([a, b]) => b === group)).filter((x): x is [string, string] => !!x).map(x => x[0])

    // Datafusion does not like having the group clause as an aggregate
    if (groupIds.filter(group => columnIds.indexOf(group) !== -1).length > 0) {
      throw new Error("Error: group clauses should not be part of the aggregate expressions")
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

      const artifact: string = await dataFusion?.query(tableId, query)
      const resultSchema = dataFusion?.get_schema(tableId)
      const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

      // Verify all the columns are present
      if (schema.column_order.filter(column => resultColumns.indexOf(column) === -1).length === 0) {
        dataFusion?.drop_table(cloneId)

      // If not, apply the artifact and merge the results
      } else {
        await dataFusion?.apply_artifact(cloneId, artifact)
        dataFusion?.merge_table(cloneId, tableId)
        dataFusion?.move_table(cloneId, tableId)
      }

      onComplete()

      return {
        identifiers: identifiers,
        transactions: [transaction],
        artifacts: [artifact],
        values: {}
      }

    } else {
      throw new Error("Cannot build query: missing identifier")
    }
  }, [ tableId, schema, columns, columnNames, log, onComplete, dataFusion, dataSpace, concepts, aggregateFns, groupClauses ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && columns.length > 1 && aggregateFns.length > 1) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => console.log(e))
    }
  }, [ leftId, tableId, replay, columns, aggregateFns, groupClauses, execute, dataFusion ])

  const handleAggregate = React.useCallback((e: any) => {
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

  const columnSelection = React.useMemo(() => {
    return columns.map((column, i) => {
      return (
        <div key={"column" + column} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={["SUM", "AVG", "MIN", "MAX"]}
            maxWidth={100}
            onClick={(item: string) => addAggregateFn(aggregateFns.map((x, j) => i === j ? item : x))}
            selected={aggregateFns[i]}
          />

          <span className="is-size-4 has-text-weight-bold px-2"> ( </span>
          <Dropdown
            items={Object.values(columnNames).filter((x) => columns.indexOf(x) === -1)}
            maxWidth={150}
            onClick={(item: string) => addColumn(columns.map((x, j) => i === j ? item : x))}
            selected={column !== null ? column: undefined}
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
            maxWidth={200}
            onClick={(item: string) => addGroupClause(groupClauses.map((x, j) => i === j ? item : x))}
            selected={group !== null ? group : undefined}
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
        <form onSubmit={handleAggregate}>
          <div className="field pb-0">
            <button className="hover-button is-right is-small" onClick={handleAddColumn}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faPlus} size="sm"/>
              </span>
            </button>
            <label className="label">Aggregate Columns</label>
          </div>

          { columnSelection }

          <div className="field pb-0">
            <button className="hover-button is-right is-small" onClick={handleAddGroupClause}>
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
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default AggregateTransformer
