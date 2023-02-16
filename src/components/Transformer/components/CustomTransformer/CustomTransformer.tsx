import React, { FC, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import Onboarding from './Onboarding'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectColumnConceptMap, selectMetadataMap, selectActiveDataSpace } from 'state/selectors'
import { createMetadata, updateTransformerWAL } from 'state/actions'

import { Schema, WAL } from 'types'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { buildQuery } from 'utils/query'
import { emptyTaxonomy } from 'utils/taxonomy'


interface CustomTransformerProps {
  id: string,
  wal?: WAL,
  tableId: string | null,
  columnNames: {[key: string]: string},
  schema?: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
  onComplete: any,
  onClose: any
}

const renderLongText = (text: string | null, width: number) => {
  const maxchars = (width * 0.75) / 8.5

  if (text && text.length > maxchars) {
    return (
      <abbr title={text}>
        { text.slice(0, maxchars - 3) + "…" }
      </abbr>
    )
  }

  return (
    text
  )
}

const CustomTransformer: FC<CustomTransformerProps> = ({ id, wal, tableId, columnNames, schema, dimensions, setHeaderCallback, onComplete, onClose }) => {
  const dispatch = useAppDispatch()

  const [idModalIsActive, setIdModalIsActive] = useState(false)
  const [valueModalIsActive, setValueModalIsActive] = useState(false)
  const [value, setValue] = useState("")
  const [query, setQuery] = useState("SELECT * FROM \"table\";")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext();
  const { keyStore } = useKeyStoreContext();

  const metadata = useAppSelector(selectMetadataMap)
  const columnConcepts = useAppSelector(selectColumnConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => {
    if (tableId) {
      setQuery("SELECT *\nFROM %1$I;")

      if (! Object.keys(log.identifiers).length) {
        setLog({...log, ...{
          identifiers: {
            1: {"id": tableId, "type": "table"}
          }
        }})
      }
    }
  }, [ tableId, log ])

  const replayTransactions = async (tableId: string, schema: Schema, wal: WAL) => {
    for (let transaction of wal.transactions) {
      const cloneId = dataFusion.clone_table(tableId, "")
      const artifact = await dataFusion?.query(tableId, buildQuery(transaction, wal, metadata, dataSpace, keyStore))

      const resultSchema = dataFusion?.get_schema(tableId)
      const resultColumns: string[] = resultSchema.fields.map((field: any) => field.name)

      if (schema.column_order.filter(column => resultColumns.indexOf(column) === -1).length === 0) {
        dataFusion?.drop_table(cloneId)
      } else {
        await dataFusion?.apply_artifact(cloneId, artifact)
        dataFusion?.merge_table(cloneId, tableId)
        dataFusion?.move_table(cloneId, tableId)
      }
    }

    onComplete()
  }

  useEffect(() => {
    if (tableId && schema && wal) {
      replayTransactions(tableId, schema, wal)
    }

  // eslint-disable-next-line
  }, [ tableId ])

  const handleCommit = () => {
    if (log.transactions.length > 0) {
      dispatch(updateTransformerWAL({
        id: id,
        workspace: "default",
        wal: log
      }))

      onClose()
    }
  }

  const handleQueryExecute = (e: any) => {
    e.preventDefault()

    const q = buildQuery(query, log, metadata, dataSpace, keyStore)

    if (tableId && schema) {
      const cloneId = dataFusion?.clone_table(tableId, "")

      dataFusion?.query(tableId, q).then((artifact: string) => {
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
            transactions: [...log.transactions, query],
            artifacts: [...log.artifacts, artifact]
          }})
          setQuery("")

          onComplete()
        })
      })
    }
  }

  const renderIdentifiers = React.useMemo(() => {
    return Object.entries(log.identifiers).map(([i, identifier]) => {
      const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(columnConcepts[identifier.id])
      const name = maybe_concept ? maybe_concept.name : identifier.id

      return (
        <tr key={i}>
          <td> {i} </td>
          <td> {renderLongText(name, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.identifiers, dimensions.width, columnConcepts, dataSpace])

  const renderValues = React.useMemo(() => {
    return Object.entries(log.values).map(([i, value]) => {
      const maybe_name = metadata[value]
      const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : value

      return (
        <tr key={i}>
          <td> {i} </td>
          <td> {renderLongText(name, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.values, dimensions.width, metadata, dataSpace, keyStore])

  const renderTransactions = React.useMemo(() => {
    const r = log.transactions.map((transaction, i) => {
      return (
        <tr key={i}>
          <td> {renderLongText(transaction, dimensions.width)} </td>
        </tr>
      )
    })

    if (! r.length) {
      return ( <tr key={0}><td> - </td></tr> )
    }

    return r
  }, [ log.transactions, dimensions.width])

  const onIdModalClose = React.useCallback(() => {
    setIdModalIsActive(false)
    setHeaderCallback(undefined)
  }, [ setIdModalIsActive, setHeaderCallback ])

  const addIdentifier = React.useCallback((id: string) => {
    if (!Object.values(log.identifiers).find(i => i.id === id)) {
      const nextId = Math.max(...Object.keys(log.identifiers).map(Number)) + 1

      setLog({...log, ...{
        identifiers: {...log.identifiers, ...{
          [nextId]: {"id": id, "type": "column"}
        }}
      }})
    }
  }, [ log, setLog ])

  const handleIdModal = () => {
    setIdModalIsActive(true)
    setHeaderCallback((id: string) => {
      addIdentifier(id)
      onIdModalClose()
    })
  }

  const renderIdModal = React.useMemo(() => {
    return (
      <div className={"modal " + (idModalIsActive ? "is-active" : "")}>
        <div className="modal-background" />
        <button className="modal-close is-large" aria-label="close" onClick={() => onIdModalClose()} />
      </div>
    )
  }, [ idModalIsActive, onIdModalClose ])

  const onValueSubmit = React.useCallback((e: any) => {
    e.preventDefault()

    const keys = Object.keys(log.values)
    const nextValue = keys.length > 0 ? Math.max(...keys.map(Number)) + 1 : 1

    const id = crypto.randomUUID()

    dispatch(createMetadata({
      id: id,
      workspace: "default",
      metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, value)
    }))

    setLog({...log, ...{
      values: {...log.values, ...{
        [nextValue]: id
      }}
    }})

    setValueModalIsActive(false)
  }, [ dataSpace, log, setLog, value, dispatch, keyStore ])

  const renderValueModal = React.useMemo(() => {
    return (
      <div className={"modal " + (valueModalIsActive ? "is-active" : "")}>
        <div className="modal-background" />
        <div className="modal-content">
          <form onSubmit={onValueSubmit}>
            <div className="field has-addons">
              <div className="control" style={{width: "100%"}}>
                <input className="input" style={{height: "40px"}} type="text" placeholder={value} value={value} onChange={(e: any) => setValue(e.target.value)}/>
              </div>

              <div className="control">
                <input type="submit" className="button is-primary" value="Add Value" />
              </div>
            </div>
          </form>

        </div>
        <button className="modal-close is-large" aria-label="close" onClick={() => setValueModalIsActive(false)} />
      </div>
    )
  }, [ valueModalIsActive, setValueModalIsActive, value, setValue, onValueSubmit ])

  if (!tableId) {
    return (
      <div className="is-relative px-4 py-4" style={{height: "100%"}}>
        <progress className="progress is-small is-primary" style={{marginTop: "50%"}} />
      </div>
    )
  }

  return (
    <div className="control-body px-4 py-4">
      <Onboarding />

      <div className="control-settings">
        { renderIdModal }
        { renderValueModal }

        <div className="field">
          <button className="hover-button is-right is-small" onClick={() => handleIdModal()}>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faPlus} size="sm"/>
            </span>
          </button>
          <label className="label"> Identifiers </label>
          <table className="table is-hoverable is-narrow is-fullwidth">
            <thead>
              <tr>
                <th style={{width: "34px"}}><span style={{fontSize: "small"}}> # </span></th>
                <th><span style={{fontSize: "small"}}> Name </span></th>
              </tr>
            </thead>

            <tbody>
              { renderIdentifiers }
            </tbody>
          </table>
        </div>

        <div className="field">
          <button className="hover-button is-right is-small" onClick={() => setValueModalIsActive(true)}>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faPlus} size="sm"/>
            </span>
          </button>
          <label className="label"> Values </label>
          <table className="table is-hoverable is-narrow is-fullwidth">
            <thead>
              <tr>
                <th style={{width: "34px"}}><span style={{fontSize: "small"}}> # </span></th>
                <th><span style={{fontSize: "small"}}> Value </span></th>
              </tr>
            </thead>

            <tbody>
              { renderValues }
            </tbody>
          </table>
        </div>

        <div className="field">
          <label className="label">Transaction Log</label>
          <table className="table is-hoverable is-narrow is-fullwidth" style={{fontSize: "small"}}>
            <tbody>
              { renderTransactions }
            </tbody>
          </table>
        </div>


        <form onSubmit={handleQueryExecute}>

          <div className="field pb-0">
            <label id="query-intro" className="label">Query</label>
            <div className="control">
              <textarea className="textarea is-hovered query-font" rows={10} placeholder={query} value={query} onChange={(e: any) => setQuery(e.target.value)} />
            </div>
          </div>

          <div className="field is-grouped is-grouped-right pt-0">
            <div className="control">
              <input type="submit" className="button is-text" value="Query" />
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

export default CustomTransformer
