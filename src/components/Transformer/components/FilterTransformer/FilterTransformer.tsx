import React, { FC, useState } from 'react'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { createMetadata, updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL } from 'types'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


interface FilterTransformerProps {
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

const FilterTransformer: FC<FilterTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, onComplete }) => {
  const dispatch = useAppDispatch()

  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [column, setColumn] = useState<string | null>(null)
  const [value, setValue] = useState<string | undefined>()
  const [valueIsLocked, setValueIsLocked] = useState(false)
  const [filterType, setFilterType] = useState("=")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext()
  const { keyStore } = useKeyStoreContext()

  const handleFilter = React.useCallback((e: any) => {
    e.preventDefault()
    setValueIsLocked(true)

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

      // Check if the value should be quoted
      const isQuoted = dataFusion?.get_schema(tableId).fields
        .filter((field: any) => field.name === columnId)
        .map((field: any) => field.type.name !== "int" && field.type.name !== "floatingpoint" && field.type.name !== "bool")

      const quoteChar = isQuoted[0] ? "'" : ""

      // Build a proper transaction to be saved, and a query for the preview
      const transaction = `SELECT %${ids[columnId]}$I FROM %${ids[tableId]}$I WHERE %${ids[columnId]}$I ${filterType} ${quoteChar}$1${quoteChar} ORDER BY 1`
      const query = `SELECT "${columnId}" FROM "${tableId}" WHERE "${columnId}" ${filterType} ${quoteChar}${value}${quoteChar} ORDER BY 1`

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

  }, [ tableId, schema.column_order, column, filterType, value, columnNames, log, dataFusion, onComplete ])

  const handleFilterType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value)
  }

  const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleCommit = () => {
    // First dispatch the value as metadata, then include it in the log
    const metadataId = crypto.randomUUID()
    const nextId = 1

    dispatch(createMetadata({
      id: metadataId,
      workspace: "default",
      metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, value)
    }))

    // TODO: handle multiple filters / values
    const logWithValues = {...log, ...{
      values: {...log.values, ...{
        [nextId]: metadataId
      }}
    }}

    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: logWithValues
    }))

    setLog(logWithValues)
  }


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <form onSubmit={handleFilter}>
        <div className="field pb-0">
          <label className="label">Filter Condition</label>
        </div>
        <div className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={Object.values(columnNames)}
            onClick={(item: string) => setColumn(item)}
          />
          <p className="control my-1">
            <span className="select">
              <select onChange={handleFilterType}>
                <option> {"="} </option>
                <option> {">"} </option>
                <option> {">="} </option>
                <option> {"<"} </option>
                <option> {"<="} </option>
              </select>
            </span>
          </p>
          <p className="control my-1">
            <input className="input is-normal" type="text" placeholder={value} onChange={handleValue} disabled={valueIsLocked} />
          </p>
        </div>

        <div className="field is-grouped is-grouped-right pt-0">
          <div className="control">
            <input type="submit" className="button is-text" value="Filter" />
          </div>
        </div>
      </form>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

export default FilterTransformer
