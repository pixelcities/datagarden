import React, { FC, useState } from 'react'

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

  const [column, setColumn] = useState<string | null>(null)
  const [aggregateFn, setAggregateFn] = useState("SUM")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext()

  const handleAggregate = React.useCallback((e: any) => {
    e.preventDefault()

    const columnId = Object.keys(columnNames).find(id => schema.column_order.indexOf(id) !== -1 && columnNames[id] === column)

    if (tableId && columnId) {
      // Check if the identifiers need to be added to the log
      const missingIdentifiers = [tableId, columnId].filter(i => Object.values(log.identifiers).indexOf(i) === -1)
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
      const transaction = `SELECT ${aggregateFn}(%${ids[columnId]}$I) FROM %${ids[tableId]}$I`
      const query = `SELECT ${aggregateFn}("${columnId}") FROM "${tableId}"`

      // Update schema to include aggregate function metadata
      const arrow_schema = dataFusion?.get_schema(tableId)
      const fields = arrow_schema.fields.map((field: any) => {
        // The active field should receive the selected aggregateFn
        if (field.name === columnId) {
          return {...field, ...{
            metadata: {
              aggregate_fn: aggregateFn.toLowerCase()
            }
          }}

        // The others will inherit the aggregateFn from their concept
        } else {
          const fullColumn = schema.columns.find(column => field.name === columnId)
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
            transactions: [...log.transactions, transaction],
            artifacts: [...log.artifacts, artifact]
          }})

          onComplete()
        })
      })
    } else {
      console.log("Cannot build query: missing identifier")
    }

  }, [ tableId, schema, column, columnNames, log, dataFusion, dataSpace, concepts, aggregateFn, onComplete ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))
  }

  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleAggregate}>
        <div className="field pb-0">
          <label className="label">Aggregate Column</label>
        </div>
        <div className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={["SUM", "AVG", "MIN", "MAX"]}
            onClick={(item: string) => setAggregateFn(item)}
          />

          <span className="is-size-4 has-text-weight-bold px-2"> ( </span>
          <Dropdown
            items={Object.values(columnNames)}
            onClick={(item: string) => setColumn(item)}
          />
          <span className="is-size-4 has-text-weight-bold px-2"> ) </span>
        </div>

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
