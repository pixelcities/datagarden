import React, { FC, useEffect, useMemo, useState } from 'react'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectMetadataMap } from 'state/selectors'
import { createMetadata, updateTransformerWAL } from 'state/actions'

import Dropdown from 'components/Dropdown'
import { Schema, WAL, ConceptA } from 'types'
import { getIdentifiers } from 'utils/query'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


interface FilterTransformerProps {
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

const FilterTransformer: FC<FilterTransformerProps> = ({ id, wal, tableId, leftId, rightId, columns, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const dataSpace = useAppSelector(selectActiveDataSpace)
  const metadata = useAppSelector(selectMetadataMap)

  const [column, setColumn] = useState<[string, string] | null>(null)
  const [value, setValue] = useState<string | undefined>()
  const [valueIsLocked, setValueIsLocked] = useState(false)
  const [filterType, setFilterType] = useState("=")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext()
  const { keyStore } = useKeyStoreContext()

  const columnNames: [string, string][] = useMemo(() => Object.entries(columns).map(([id, concept]) => [id, concept.name]), [ columns ])

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && wal && wal.transactions.length > 0) {
      for (const match of wal.transactions[0].split("WHERE")[1].matchAll(/([=!><]+) +\$1/g)) {
        if (match[1]) {
          setFilterType(match[1])
        }
      }

      for (const match of wal.transactions[0].split("WHERE")[1].matchAll(/ *%([0-9]+)\$I/g)) {
        if (match[1]) {
          const columnId = wal.identifiers[Number(match[1])]?.id
          const columnName = columns[columnId]?.name

          if (columnName) {
            setColumn([columnId, columnName])
          }
        }
      }

      // Just one value for now
      const valueId = wal.values[1]
      if (valueId in metadata) {
        setValue(keyStore?.decrypt_metadata(dataSpace?.key_id, metadata[valueId]))
      }

      setStartup(false)
      setReplay(true)
      setValueIsLocked(true)
    }
  }, [ tableId, startup, wal, columns, metadata, keyStore, dataSpace?.key_id ])

  const execute = React.useCallback(async () => {
    if (tableId && column) {
      const columnId = column[0]
      const { identifiers, ids } = getIdentifiers(log.identifiers, [tableId], [columnId])

      // Check if the value should be quoted
      const isQuoted = dataFusion?.get_schema(tableId).fields
        .filter((field: any) => field.name === columnId)
        .map((field: any) => field.type.name !== "int" && field.type.name !== "floatingpoint" && field.type.name !== "bool")

      const quoteChar = isQuoted[0] ? "'" : ""

      // Build a proper transaction to be saved, and a query for the preview
      const transaction = `SELECT %${ids[columnId]}$I FROM %${ids[tableId]}$I WHERE %${ids[columnId]}$I ${filterType} ${quoteChar}$1${quoteChar} ORDER BY 1`
      const query = `SELECT "${columnId}" FROM "${tableId}" WHERE "${columnId}" ${filterType} ${quoteChar}${value}${quoteChar} ORDER BY 1`

      const cloneId = dataFusion?.clone_table(tableId, "")

      const artifact: string = await dataFusion?.query(tableId, query)
      const resultSchema = dataFusion?.get_schema(tableId)
      const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

      // Verify all the columns are present
      if (schema.column_order.filter(col => resultColumns.indexOf(col) === -1).length === 0) {
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
  }, [ tableId, schema.column_order, column, filterType, value, log.identifiers, dataFusion, onComplete ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && column && value) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => console.log(e))
    }
  }, [ leftId, tableId, replay, column, value, execute, dataFusion ])

  const handleFilter = React.useCallback((e: any) => {
    e.preventDefault()
    setValueIsLocked(true)

    dataFusion?.clone_table(leftId, tableId)
    execute()
      .then((result) => {
        setLog(result)
      })
      .catch((e) => console.log(e))
  }, [ tableId, leftId, execute, dataFusion ])

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

    onClose()
  }

  const renderFilter = useMemo(() => {
    return (
      <div className="field has-addons is-horizontal pb-0">
        <Dropdown
          key={"dropdown-col-" + (column !== null).toString()}
          items={columnNames}
          maxWidth={150}
          onClick={(item) => setColumn(item)}
          selected={column}
          isDisabled={valueIsLocked}
        />
        <p className="control my-1">
          <span className="select">
            <select onChange={handleFilterType} value={filterType}>
              <option> {"="} </option>
              <option> {"!="} </option>
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
    )
  }, [ columnNames, column, filterType, value, valueIsLocked ])

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
        <form onSubmit={handleFilter}>
          <div className="field pb-0">
            <label className="label">Filter Condition</label>
          </div>

          { renderFilter }

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Filter" />
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

export default FilterTransformer
