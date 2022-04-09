import React, { FC, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { useAppSelector } from 'hooks'
import { selectMetadataMap, selectCollectionById } from 'state/selectors'

import { Schema, WAL } from 'types'

import DataTable from 'components/DataTable'

import { useDataFusionContext } from 'utils/DataFusionContext'
import { useKeyStoreContext } from 'utils/KeyStoreContext'
import { useAuthContext } from 'utils/AuthContext'
import { loadRemoteTable } from 'utils/loadRemoteTable'

import './Transformer.sass'

interface TransformerProps {
  id: string,
  collections: string[],
  transformers: string[],
  wal?: WAL,
  onClose: () => void
}

interface TransformerSettingsProps {
  wal?: WAL,
  tableId: string | null,
  columnNames: {[key: string]: string},
  schema?: Schema,
  dimensions: {height: number, width: number},
  onComplete: any
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

const TransformerSettings: FC<TransformerSettingsProps> = ({ wal, tableId, columnNames, schema, dimensions, onComplete }) => {
  const [query, setQuery] = useState("SELECT * FROM \"table\";")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: []})

  const { dataFusion } = useDataFusionContext();

  useEffect(() => {
    if (tableId) {
      setQuery("SELECT *\nFROM %1$I;")

      if (! Object.keys(log.identifiers).length) {
        setLog({...log, ...{
          identifiers: {
            1: tableId
          }
        }})
      }
    }
  }, [ tableId, log.identifiers ])

  const handleQueryExecute = (e: any) => {
    e.preventDefault()

    if (tableId) {
      dataFusion?.query(tableId, query).then(() => {
        setLog({...log, ...{
          transactions: [...log.transactions, query]
        }})
        setQuery("")

        onComplete()
      })
    }
  }

  const renderIdentifiers = React.useMemo(() => {
    return Object.entries(log.identifiers).map(([i, identifier]) => {
      return (
        <tr>
          <td> {i} </td>
          <td> {renderLongText(identifier, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.identifiers, dimensions.width])

  const renderValues = React.useMemo(() => {
    return Object.entries(log.values).map(([i, value]) => {
      return (
        <tr>
          <td> {i} </td>
          <td> {renderLongText(value, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.values, dimensions.width])

  const renderTransactions = React.useMemo(() => {
    const r = log.transactions.map(transaction => {
      return (
        <tr>
          <td> {renderLongText(transaction, dimensions.width)} </td>
        </tr>
      )
    })

    if (! r.length) {
      return "-"
    }

    return r
  }, [ log.transactions, dimensions.width])

  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      <div className="field">
        <button className="plus-button" onClick={() => console.log("click")}>
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
        <button className="plus-button" onClick={() => console.log("click")}>
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
          <label className="label">Query</label>
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

      <div className="commit-footer">
        <button className="button is-primary is-fullwidth"> Commit </button>
      </div>
    </div>
  )
}

const Transformer: FC<TransformerProps> = ({id, collections, transformers, wal, onClose}) => {
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({height: 0, width: 0});
  const [isActive, setIsActive] = useState(true)
  const [inputId, setInputId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [versionId, setVersionId] = useState<number>(0)

  const { user } = useAuthContext();
  const { keyStore } = useKeyStoreContext();
  const { arrow, dataFusion, loadDataFusion } = useDataFusionContext();

  const collection = useAppSelector(state => selectCollectionById(state, collections[0]))
  const metadata = useAppSelector(selectMetadataMap)

  useEffect(() => loadDataFusion(), [ loadDataFusion ])
  useEffect(() => {
    if (collection && !inputId && dataFusion?.table_exists(collection.id)) {
      setInputId(collection.id)

    } else if (collection?.id && collection.uri && !inputId) {
      loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore, () => setInputId(collection.id))
    }
  }, [collection, user, arrow, dataFusion, keyStore, inputId])

  useEffect(() => {
    if (inputId) {
      setPreviewId(dataFusion?.clone_table(inputId))
    }
  }, [ inputId, dataFusion ])

  useLayoutEffect(() => {
    if (settingsRef.current) {
      const rect = settingsRef.current.getBoundingClientRect()

      setDimensions({
        height: rect.height,
        width: rect.width
      })
    }
  }, [settingsRef]);


  const columnNames = React.useMemo(() => {
    let attributes: {[key: string]: string} = {};

    if (collection) {
      collection.schema.columns.forEach(column => {
        const maybe_name = metadata[column.id]
        const name = maybe_name ? keyStore?.decrypt_metadata(maybe_name) : column.id;

        attributes[column.id] = name
      })
    }

    return attributes
  }, [ keyStore, collection, metadata ])


  const handleClose = () => {
    setIsActive(false)
    onClose()
  }

  return (
    <div className={"p-modal " + (isActive ? "is-active" : "")}>
      <div className="modal-background"></div>
      <div className="p-modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Placeholder</p>
          <button className="delete" aria-label="close" onClick={handleClose}></button>
        </header>

        <section className="modal-card-body is-relative px-0 py-0">
          { inputId && collection ?
            <DataTable
              id={inputId}
              schema={collection.schema}
              interactiveHeader={false}
              style={{width: "40%"}}
            />
          : null
          }

          <div ref={settingsRef} className="transformer-control-container">
            <TransformerSettings
              wal={wal}
              tableId={previewId}
              columnNames={columnNames}
              schema={collection?.schema}
              dimensions={dimensions}
              onComplete={() => setVersionId(versionId + 1)}
            />
          </div>

          { previewId && collection ?
            <DataTable
              id={previewId}
              schema={collection.schema}
              interactiveHeader={false}
              style={{width: "40%", left: "60%", position: "absolute", top: 0}}
              versionId={versionId}
            />
          : null
          }

        </section>
      </div>
    </div>
  )
}

export default Transformer

