import React, { FC, useMemo, useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLevelDownAlt } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { updateTransformerWAL, sendLocalNotification } from 'state/actions'

import FormulaBuilder from 'components/FormulaBuilder'
import Dropdown from 'components/Dropdown'
import { Schema, WAL, ConceptA } from 'types'
import { getIdentifiers } from 'utils/query'
import { saveState, loadState, useConst  } from 'utils/helpers'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


interface FunctionTransformerProps {
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

const FunctionTransformer: FC<FunctionTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [column, setColumn] = useState<[string, string]| null>(null)
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})
  const [formula, setFormula] = useState("")
  const [ast, setAst] = useState("")

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const LOAD_STATE = useConst([setColumn, setAst, setFormula])
  const SAVE_STATE = useConst([column, ast, formula])

  const { dataFusion } = useDataFusionContext()
  const { keyStore } = useKeyStoreContext()

  const dataSpace = useAppSelector(selectActiveDataSpace)

  const columnNames: [string, string][] = useMemo(() => Object.entries(columns).map(([id, concept]) => [id, concept.name]), [ columns ])

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

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && dataSpace?.key_id) {
      if (wal && wal.transactions.length > 0 && wal.data) {
        loadState(keyStore?.decrypt_metadata(dataSpace.key_id, wal.data), LOAD_STATE)
        setReplay(true)
      }

      setStartup(false)
    }
  }, [ tableId, startup, wal, columns, LOAD_STATE, dataSpace?.key_id, keyStore ])

  const execute = React.useCallback(async () => {
    if (tableId && column) {
      let columnIds = [column[0]]

      // Extract the columnIds from the formula
      for (const match of formula.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)) {
        if (columnIds.indexOf(match[0]) === -1) {
          columnIds.push(match[0])
        }
      }

      const { identifiers, ids } = getIdentifiers(log.identifiers, [tableId], columnIds)

      // Build a proper transaction to be saved, and a query for the preview. The formula will be rewritten to include
      // identifier references.
      let alteredFormula = formula
      columnIds.forEach(columnId => {
        alteredFormula = alteredFormula.replace(new RegExp(`(?:"${columnId}")`, "g"), `%${ids[columnId]}$I`)
      })

      const transaction = `SELECT ${alteredFormula} AS %${ids[column[0]]}$I FROM %${ids[tableId]}$I`
      const query = `SELECT ${formula} AS "${column[0]}" FROM "${tableId}"`

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
        values: {},
        data: keyStore?.encrypt_metadata(dataSpace?.key_id, saveState(SAVE_STATE))
      }
    } else {
      throw new Error("Cannot build query: missing identifier")
    }
  }, [ tableId, schema.column_order, column, formula, log.identifiers, SAVE_STATE, dataSpace, dataFusion, keyStore, onComplete ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && column && formula) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => onError(e ? e.message : "Error executing query"))
    }
  }, [ leftId, tableId, replay, column, formula, execute, dataFusion, onError ])

  const handleFunction = React.useCallback((e: any) => {
    e.preventDefault()

    dataFusion?.clone_table(leftId, tableId)
    execute()
      .then((result) => {
        setLog(result)
      })
      .catch((e) => onError(e ? e.message : "Error executing query"))
  }, [ leftId, tableId, execute, setLog, dataFusion, onError ])

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
            <label className="label">Formula</label>
          </div>
          <div className="field has-addons is-horizontal pb-0">
            <Dropdown
              key={"dropdown-col-" + (column !== null).toString()}
              items={columnNames}
              maxWidth={150}
              onClick={item => setColumn(item)}
              selected={column}
            />
            <span className="icon is-small pl-3 mt-4">
              <FontAwesomeIcon icon={faLevelDownAlt} size="lg"/>
            </span>
          </div>

          <div className="field pb-0">
            <div className="control">
              <div>
                { !startup &&
                  <FormulaBuilder
                    schema={schema}
                    initialState={ast}
                    onChange={(ast, f) => { setAst(ast); setFormula(f); }}
                  />
                }
              </div>
            </div>
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Apply Function" />
            </div>
          </div>
        </form>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit} disabled={log.transactions.length === 0}> Commit </button>
      </div>
    </div>
  )
}

export default FunctionTransformer
