import React, { FC, useEffect, useState } from 'react'

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
  onComplete: any,
  onClose: any
}

const FunctionTransformer: FC<FunctionTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [column, setColumn] = useState<string | null>(null)
  const [selectedFunction, selectFunction] = useState<Function1 | null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext()

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && wal && wal.transactions.length > 0) {
      for (const match of wal.transactions[0].matchAll(/([a-zA-Z0-9_]+)\(([[0-9I%$]+)\)/g)) {
        if (match[1] && match[2]) {
          const id = Number(match[2].match(/%([0-9]+)\$I/)![1])
          const columnId = wal.identifiers[id]
          const columnName = columnNames[columnId]

          if (columnName) {
            selectFunction(Function1[match[1] as Function1Key])
            setColumn(columnName)
          }
        }
      }

      setStartup(false)
      setReplay(true)
    }
  }, [ tableId, startup, wal, columnNames ])

  const execute = React.useCallback(async () => {
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
  }, [ tableId, schema.column_order, column, selectedFunction, columnNames, log.identifiers, dataFusion, onComplete ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && column && selectedFunction) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => console.log(e))
    }
  }, [ leftId, tableId, replay, column, selectedFunction, execute, dataFusion ])

  const handleFunction = React.useCallback((e: any) => {
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
        <form onSubmit={handleFunction}>
          <div className="field pb-0">
            <label className="label">Function</label>
          </div>
          <div className="field has-addons is-horizontal pb-0">
            <Dropdown
              key={selectedFunction || "fn"}
              items={Object.keys(Function1)}
              maxWidth={120}
              onClick={(item: string) => selectFunction((Function1[item as Function1Key]))}
              selected={selectedFunction !== null ? selectedFunction : undefined}
            />

            <span className="is-size-4 has-text-weight-bold px-2"> ( </span>
            <Dropdown
              key={column || "col"}
              items={Object.values(columnNames)}
              maxWidth={150}
              onClick={(item: string) => setColumn(item)}
              selected={column !== null ? column : undefined}
            />
            <span className="is-size-4 has-text-weight-bold px-2"> ) </span>
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Apply Function" />
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

export default FunctionTransformer
