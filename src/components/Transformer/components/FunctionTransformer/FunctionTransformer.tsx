import React, { FC, useState } from 'react'

import { useAppDispatch } from 'hooks'
import { updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL, Function1 } from 'types'

import { useDataFusionContext } from 'contexts'


type Function1Key = keyof typeof Function1

interface FunctionTransformerProps {
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

const FunctionTransformer: FC<FunctionTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete }) => {
  const dispatch = useAppDispatch()

  const [column, setColumn] = useState<string | null>(null)
  const [selectedFunction, selectFunction] = useState<Function1 | null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext()

  const handleFunction = React.useCallback((e: any) => {
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
      const transaction = `SELECT ${selectedFunction}(%${ids[columnId]}$I) AS %${ids[columnId]}$I FROM %${ids[tableId]}$I`
      const query = `SELECT ${selectedFunction}("${columnId}") AS "${columnId}" FROM "${tableId}"`

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

  }, [ tableId, schema.column_order, column, selectedFunction, columnNames, log, dataFusion, onComplete ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))
  }


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleFunction}>
        <div className="field pb-0">
          <label className="label">Function</label>
        </div>
        <div className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={Object.keys(Function1)}
            onClick={(item: string) => selectFunction((Function1[item as Function1Key]))}
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
            <input type="submit" className="button is-text" value="Apply Function" />
          </div>
        </div>
      </form>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default FunctionTransformer
