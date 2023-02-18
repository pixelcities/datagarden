import React, { FC, useMemo, useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { createConcept, updateTransformerWAL } from 'state/actions'
import { selectConceptMap, selectActiveDataSpace } from 'state/selectors'

import Dropdown from 'components/Dropdown'
import { Identifier, Schema, WAL, DataType, SqlTypeMap } from 'types'
import { getIdentifiers } from 'utils/query'
import { emptyTaxonomy } from 'utils/taxonomy'

import { useDataFusionContext } from 'contexts'

type DataTypeKey = keyof typeof DataType

interface AttributeTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  leftId: string | null,
  rightId: string | null,
  columnNames: {[key: string]: string},
  schema: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  setSchemaCallback: any,
  onComplete: any,
  onClose: any
}

const AttributeTransformer: FC<AttributeTransformerProps> = ({ id, wal, tableId, leftId, rightId, columnNames, schema, dimensions, setHeaderCallback, setSchemaCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [alterModalIsActive, setAlterModalIsActive] = useState(false)
  const [newColumnModalIsActive, setNewColumnModalIsActive] = useState(false)
  const [newColumn, setNewColumn] = useState("")
  const [dropColumns, addDropColumn] = useState<([string, string]| null)[]>([])
  const [newColumns, addNewColumn] = useState<([string, string])[]>([])
  const [newTypes, addNewType] = useState<string[]>([])
  const [alterColumns, addAlterColumn] = useState<([string, string])[]>([])
  const [alterTypes, addAlterType] = useState<string[]>([])
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})
  const [isLocked, setIsLocked] = useState(false)

  const [startup, setStartup] = useState(true)
  const [replay, setReplay] = useState(false)

  const { dataFusion } = useDataFusionContext()

  // Rebuild state
  useEffect(() => {
    if (tableId && startup && wal && wal.transactions.length > 0) {
      let dropC: [string, string][] = []
      let newC: [string, string][] = []
      let newT: string[] = []
      let alterC: [string, string][] = []
      let alterT: string[] = []

      for (const id of Object.values(wal.identifiers)) {
        if (id.type === "column") {
          if (id.action === "drop") {
            dropC.push([id.id, columnNames[id.id]])
          }

          if (id.action === "add") {
            const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[id.params![0]])

            if (maybe_concept && maybe_concept.dataType) {
              newC.push([id.id, maybe_concept.name])
              newT.push(maybe_concept.dataType)
            }
          }

          if (id.action === "alter") {
            const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[id.params![0]])

            if (maybe_concept && maybe_concept.dataType) {
              alterC.push([id.id, maybe_concept.name])
              alterT.push(maybe_concept.dataType)
            }
          }
        }
      }

      addDropColumn(dropC)
      addNewColumn(newC)
      addNewType(newT)
      addAlterColumn(alterC)
      addAlterType(alterT)

      setStartup(false)
      setReplay(true)
      setIsLocked(true)
    }
  }, [ tableId, startup, wal, columnNames, concepts, dataSpace ])

  const execute = React.useCallback(async () => {
    const dropIds = dropColumns.filter((x): x is [string, string] => !!x).map(d => d[0])
    const newIds = newColumns.filter((x): x is [string, string] => !!x).map(d => d[0])
    const alterIds = alterColumns.filter((x): x is [string, string] => !!x).map(d => d[0])

    if (tableId) {
      const { identifiers, ids } = getIdentifiers(log.identifiers, [tableId], [...dropIds, ...newIds, ...alterIds])

      // Add the actions to the identifiers log
      for (const dropId of dropIds) {
        identifiers[ids[dropId]] = {...identifiers[ids[dropId]], ...{"action": "drop"}}
      }

      for (const column of newIds) {
        identifiers[ids[column]] = {...identifiers[ids[column]], ...{"action": "add"}}
      }

      for (const column of alterIds) {
        identifiers[ids[column]] = {...identifiers[ids[column]], ...{"action": "alter"}}
      }

      // Step 1: Clone, optionally drop columns
      let transaction = `SELECT * FROM %${ids[tableId]}$I`
      let query = `SELECT * FROM "${tableId}"`

      let cloneId = dataFusion?.clone_table(tableId, "")
      dataFusion?.drop_columns(cloneId, dropIds)

      // Step 2: Add new columns so the cloned schema includes the new attributes
      const addColumnIdClauses = newColumns.map((column, i) => `CAST(NULL AS ${SqlTypeMap[newTypes[i]]}) AS %${ids[column[0]]}$I`)
      const addColumnNameClauses = newColumns.map((column, i) => `CAST(NULL AS ${SqlTypeMap[newTypes[i]]}) AS "${column[0]}"`)

      if (addColumnIdClauses.length > 0) {
        transaction = `SELECT ${addColumnIdClauses.join(",")} FROM %${ids[tableId]}$I`
        query = `SELECT ${addColumnNameClauses.join(",")} FROM "${tableId}"`
      }

      const artifact: string = await dataFusion?.query(tableId, query)

      if (addColumnIdClauses.length > 0) {
        dataFusion?.append_table(tableId, cloneId)
        cloneId = dataFusion?.clone_table(tableId, "") // Append will drop the clone
      }

      // Step 3: Alter any existing columns
      const alterColumnIdClauses = alterColumns.map((column, i) => `CAST(%${ids[column[0]]}$I AS ${SqlTypeMap[alterTypes[i]]}) AS %${ids[column[0]]}$I`)
      const alterColumnNameClauses = alterColumns.map((column, i) => `CAST("${column[0]}" AS ${SqlTypeMap[alterTypes[i]]}) AS "${column[0]}"`)

      let alterTransaction, alterQuery, alterArtifact // If any exist, this will be a seperate transaction
      if (alterColumnIdClauses.length > 0) {
        alterTransaction = `SELECT ${alterColumnIdClauses.join(",")} FROM %${ids[tableId]}$I`
        alterQuery = `SELECT ${alterColumnNameClauses.join(",")} FROM "${tableId}"`

        alterArtifact = await dataFusion?.query(tableId, alterQuery)
      }

      await dataFusion?.apply_artifact(cloneId, artifact) // Not really needed, but done for consistency
      dataFusion?.merge_table(cloneId, tableId)
      dataFusion?.move_table(cloneId, tableId)

      const newSchema = {...schema, ...{
        column_order: [
          ...schema.column_order.filter(c => dropIds.indexOf(c) === -1),
          ...newColumns.map(x => x[1]) // Use the name as id, so that the concept does not have to exist just yet and the id fallback appears correct
        ],
        columns: [
          ...schema.columns.filter(c => dropIds.indexOf(c.id) === -1),
          ...newColumns.map(x => { return {id: x[1], concept_id: "", key_id: "", shares: []} })
        ]
      }}

      setSchemaCallback(newSchema)
      onComplete()

      return {
        identifiers: identifiers,
        transactions: alterTransaction ? [transaction, alterTransaction] : [transaction],
        artifacts: alterArtifact ? [artifact, alterArtifact] : [artifact],
        values: {}
      }
    } else {
      throw new Error("Cannot build query: missing identifier")
    }
  }, [ tableId, dropColumns, newColumns, newTypes, alterColumns, alterTypes, log.identifiers, schema, setSchemaCallback, dataFusion, onComplete ])

  // Replay if old state was loaded
  useEffect(() => {
    if (tableId && replay && (dropColumns.length > 0 || newColumns.length > 0 || alterColumns.length > 0)) {
      setReplay(false)

      dataFusion?.clone_table(leftId, tableId)
      execute()
        .catch((e) => console.log(e))
    }
  }, [ leftId, tableId, replay, dropColumns, newColumns, alterColumns, execute, dataFusion ])

  const handleExecute = React.useCallback((e: any) => {
    e.preventDefault()

    dataFusion?.clone_table(leftId, tableId)
    execute()
      .then((result) => {
        setLog(result)
      })
      .catch((e) => console.log(e))
  }, [ leftId, tableId, execute, setLog, dataFusion ])

  const handleCommit = () => {
    let identifiers: {[key: string]: Identifier} = log.identifiers
    let ids: {[key: string]: string} = {}
    Object.entries(identifiers).forEach(([i, id]) => ids[id.id] = i)

    newColumns.forEach((column, i) => {
      const taxonomy = emptyTaxonomy(dataSpace?.key_id)
      const conceptId = crypto.randomUUID()
      const dataType = DataType[newTypes[i] as DataTypeKey]

      if (dataType) {
        let aggregateFn = "array_agg"

        if (dataType === DataType.RelativeInteger || dataType === DataType.RelativeDecimal) {
          aggregateFn = "avg"
        } else if (dataType === DataType.AbsoluteInteger || dataType === DataType.AbsoluteDecimal) {
          aggregateFn = "sum"
        }

        const concept = taxonomy.serialize({
          id: conceptId,
          workspace: "default",
          name: column[1],
          dataType: dataType,
          aggregateFn: aggregateFn
        })

        if (concept) {
          dispatch(createConcept(concept))

          identifiers[ids[column[0]]] = {...identifiers[ids[column[0]]], ...{"params": [conceptId]}}
        }
      }
    })

    alterColumns.forEach((column, i) => {
      const taxonomy = emptyTaxonomy(dataSpace?.key_id)
      const conceptId = crypto.randomUUID()
      const dataType = DataType[alterTypes[i] as DataTypeKey]

      if (dataType) {
        let aggregateFn = "array_agg"

        if (dataType === DataType.RelativeInteger || dataType === DataType.RelativeDecimal) {
          aggregateFn = "avg"
        } else if (dataType === DataType.AbsoluteInteger || dataType === DataType.AbsoluteDecimal) {
          aggregateFn = "sum"
        }

        const concept = taxonomy.serialize({
          id: conceptId,
          workspace: "default",
          name: column[1],
          dataType: dataType,
          aggregateFn: aggregateFn
        })

        if (concept) {
          dispatch(createConcept(concept))

          identifiers[ids[column[0]]] = {...identifiers[ids[column[0]]], ...{"params": [conceptId]}}
        }
      }
    })

    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: {...log, ...{identifiers: identifiers}}
    }))

    onClose()
  }

  const handleAddDropColumn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    addDropColumn([...dropColumns, null])
  }

  const dropSelection = useMemo(() => {
    return dropColumns.map((drop, i) => {
      return (
        <div key={"column" + i} className="field has-addons is-horizontal pb-0">
          <Dropdown
            items={Object.entries(columnNames)}
            maxWidth={200}
            onClick={(item) => addDropColumn(dropColumns.map((x, j) => i === j ? item : x))}
            selected={drop}
            isDisabled={isLocked}
          />

          { (i !== dropColumns.length -1) ?
            <span className="is-size-4 has-text-weight-bold px-2 pt-2"> , </span>
            : null
          }

        </div>
      )
    })
  }, [ columnNames, dropColumns, isLocked ])

  const onNewColumnSubmit = useCallback((e: any) => {
    e.preventDefault()

    if (newColumn !== "") {
      addNewColumn([...newColumns, [crypto.randomUUID(), newColumn]])
      addNewType([...newTypes, "String"])

      setNewColumn("")
      setNewColumnModalIsActive(false)
    }
  }, [ newColumn, newColumns, newTypes ])

  const renderNewColumnModal = useMemo(() => {
    return (
      <div className={"modal " + (newColumnModalIsActive ? "is-active" : "")}>
        <div className="modal-background" />
        <div className="modal-content">
          <form onSubmit={onNewColumnSubmit}>
            <div className="field has-addons">
              <div className="control" style={{width: "100%"}}>
                <input className="input" style={{height: "40px"}} type="text" value={newColumn} onChange={(e: any) => setNewColumn(e.target.value)}/>
              </div>

              <div className="control">
                <input type="submit" className="button is-primary" value="Create Attribute" />
              </div>
            </div>
          </form>

        </div>
        <button className="modal-close is-large" aria-label="close" onClick={() => setNewColumnModalIsActive(false)} />
      </div>
    )
  }, [ newColumnModalIsActive, newColumn, onNewColumnSubmit ])

  const newSelection = useMemo(() => {
    return newColumns.map((newColumn, i) => {
      return (
        <tr key={i}>
          <td>
            <input className="input" style={{marginTop: "0.1rem", width: 125}} disabled={true} value={newColumn[1]} />
          </td>

          <td>
            <Dropdown<[string, DataType]>
              items={Object.entries(DataType)}
              maxWidth={75}
              onClick={item => addNewType(newTypes.map((x, j) => i === j ? item[0] : x))}
              selected={[newTypes[i], DataType[(newTypes[i] as DataTypeKey)]]}
              isDisabled={isLocked}
            />
          </td>
        </tr>
      )
    })
  }, [ newColumns, newTypes, isLocked ])

  const onAlterModalClose = useCallback(() => {
    setAlterModalIsActive(false)
    setHeaderCallback(undefined)
  }, [ setAlterModalIsActive, setHeaderCallback ])

  const addAlterColumnCb = useCallback((id: string) => {
    const columnName = columnNames[id]

    if (columnName) {
      addAlterColumn([...alterColumns, [id, columnName]])
      addAlterType([...alterTypes, "String"])
    }
  }, [ columnNames, alterColumns, alterTypes ])

  const handleAlterModal = () => {
    setAlterModalIsActive(true)
    setHeaderCallback((id: string) => {
      addAlterColumnCb(id)
      onAlterModalClose()
    })
  }

  const renderAlterModal = useMemo(() => {
    return (
      <div className={"modal " + (alterModalIsActive ? "is-active" : "")}>
        <div className="modal-background" />
        <button className="modal-close is-large" aria-label="close" onClick={() => onAlterModalClose()} />
      </div>
    )
  }, [ alterModalIsActive, onAlterModalClose ])

  const alterSelection = useMemo(() => {
    return alterColumns.map((alterColumn, i) => {
      return (
        <tr key={i}>
          <td>
            <input className="input" style={{marginTop: "0.1rem", width: 125}} disabled={true} value={alterColumn[1]} />
          </td>

          <td>
            <Dropdown<[string, DataType]>
              items={Object.entries(DataType)}
              maxWidth={75}
              onClick={item => addAlterType(alterTypes.map((x, j) => i === j ? item[0] : x))}
              selected={[alterTypes[i], DataType[(alterTypes[i] as DataTypeKey)]]}
              isDisabled={isLocked}
            />
          </td>
        </tr>
      )
    })
  }, [ alterColumns, alterTypes, isLocked ])

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
        { renderAlterModal }
        { renderNewColumnModal }

        <div>
          <div className="field pb-0">
            <button className="hover-button is-right is-small" onClick={handleAddDropColumn} disabled={isLocked}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faPlus} size="sm"/>
              </span>
            </button>
            <label className="label">Drop Attributes</label>
          </div>

          { dropSelection }

          <div className="field pt-6 pb-0">
            <button className="hover-button is-right is-small" onClick={() => setNewColumnModalIsActive(true)} disabled={isLocked}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faPlus} size="sm"/>
              </span>
            </button>
            <label className="label">Add Attributes</label>
          </div>

          <table className="table is-hoverable is-narrow is-fullwidth">
            <thead>
              <tr>
                <th style={{minWidth: "125px"}}><span style={{fontSize: "small"}}> Name </span></th>
                <th><span style={{fontSize: "small"}}> Data Type </span></th>
              </tr>
            </thead>

            <tbody>
              { newSelection }
            </tbody>
          </table>

          <div className="field pt-6 pb-0">
            <button className="hover-button is-right is-small" onClick={() => handleAlterModal()} disabled={isLocked}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faPlus} size="sm"/>
              </span>
            </button>
            <label className="label">Alter Attributes</label>
          </div>

          <table className="table is-hoverable is-narrow is-fullwidth">
            <thead>
              <tr>
                <th style={{minWidth: "125px"}}><span style={{fontSize: "small"}}> Name </span></th>
                <th><span style={{fontSize: "small"}}> Data Type </span></th>
              </tr>
            </thead>

            <tbody>
              { alterSelection }
            </tbody>
          </table>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Apply" onClick={handleExecute} disabled={isLocked} />
            </div>
          </div>
        </div>
      </div>

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth" onClick={handleCommit} disabled={isLocked}> Commit </button>
      </div>
    </div>
  )
}

export default AttributeTransformer
