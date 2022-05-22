import React, { FC, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectMetadataMap, selectCollectionById } from 'state/selectors'
import { createMetadata, updateMetadata, updateTransformerWAL } from 'state/actions'

import { Schema, WAL } from 'types'

import DataTable from 'components/DataTable'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
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
  id: string,
  wal?: WAL,
  tableId: string | null,
  columnNames: {[key: string]: string},
  schema?: Schema,
  dimensions: {height: number, width: number},
  setHeaderCallback: any,
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

const buildQuery = (query: string, log: WAL, metadata: any, keyStore: any) => {
  let q = query

  Object.entries(log.identifiers).forEach(([i, id]) => {
    q = q.replace(new RegExp(`(?:%(${i})\\$I)`, "g"), `"${id}"`)
  })

  Object.entries(log.values).forEach(([i, v]) => {
    const maybe = metadata[v]

    if (maybe) {
      const dvalue = keyStore?.decrypt_metadata(maybe)

      q = q.replace(new RegExp(`(?<!\\$)\\$(?!\\$)(${i})`, "g"), `${dvalue}`)

    } else {
      console.log(`Cannot decrypt value ${i} to construct query`)
    }
  })

  return q
}

const TransformerSettings: FC<TransformerSettingsProps> = ({ id, wal, tableId, columnNames, schema, dimensions, setHeaderCallback, onComplete }) => {
  const dispatch = useAppDispatch()

  const [idModalIsActive, setIdModalIsActive] = useState(false)
  const [valueModalIsActive, setValueModalIsActive] = useState(false)
  const [value, setValue] = useState("")
  const [query, setQuery] = useState("SELECT * FROM \"table\";")
  const [log, setLog] = useState<WAL>(wal ?? {identifiers: {}, values: {}, transactions: [], artifacts: []})

  const { dataFusion } = useDataFusionContext();
  const { keyStore } = useKeyStoreContext();

  const metadata = useAppSelector(selectMetadataMap)

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
  }, [ tableId, log ])

  const replayTransactions = async (tableId: string, wal: WAL) => {
    for (let transaction of wal.transactions) {
      await dataFusion?.query(tableId, buildQuery(transaction, wal, metadata, keyStore))
    }

    onComplete()
  }

  useEffect(() => {
    if (tableId && wal) {
      replayTransactions(tableId, wal)
    }

  // eslint-disable-next-line
  }, [ tableId ])

  const handleCommit = () => {
    dispatch(updateTransformerWAL({
      id: id,
      workspace: "default",
      wal: log
    }))
  }

  const handleQueryExecute = (e: any) => {
    e.preventDefault()

    const q = buildQuery(query, log, metadata, keyStore)

    if (tableId) {
      dataFusion?.query(tableId, q).then((artifact: string) => {
        setLog({...log, ...{
          transactions: [...log.transactions, query],
          artifacts: [...log.artifacts, artifact]
        }})
        setQuery("")

        onComplete()
      })
    }
  }

  const renderIdentifiers = React.useMemo(() => {
    return Object.entries(log.identifiers).map(([i, identifier]) => {
      const maybe_name = metadata[identifier]
      const name = maybe_name ? keyStore?.decrypt_metadata(maybe_name) : identifier

      return (
        <tr key={i}>
          <td> {i} </td>
          <td> {renderLongText(name, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.identifiers, dimensions.width, metadata, keyStore])

  const renderValues = React.useMemo(() => {
    return Object.entries(log.values).map(([i, value]) => {
      const maybe_name = metadata[value]
      const name = maybe_name ? keyStore?.decrypt_metadata(maybe_name) : value

      return (
        <tr key={i}>
          <td> {i} </td>
          <td> {renderLongText(name, dimensions.width)} </td>
        </tr>
      )
    })
  }, [log.values, dimensions.width, metadata, keyStore])

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
    if (Object.values(log.identifiers).filter(i => i === id).length === 0) {
      const nextId = Math.max(...Object.keys(log.identifiers).map(Number)) + 1

      setLog({...log, ...{
        identifiers: {...log.identifiers, ...{
          [nextId]: id
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
      metadata: keyStore?.encrypt_metadata(value)
    }))

    setLog({...log, ...{
      values: {...log.values, ...{
        [nextValue]: id
      }}
    }})

    setValueModalIsActive(false)
  }, [ log, setLog, value, dispatch, keyStore ])

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


  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>

      { renderIdModal }
      { renderValueModal }

      <div className="field">
        <button className="plus-button" onClick={() => handleIdModal()}>
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
        <button className="plus-button" onClick={() => setValueModalIsActive(true)}>
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
        <button className="button is-primary is-fullwidth" onClick={handleCommit}> Commit </button>
      </div>
    </div>
  )
}

const Transformer: FC<TransformerProps> = ({id, collections, transformers, wal, onClose}) => {
  const dispatch = useAppDispatch()

  const settingsRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({height: 0, width: 0});
  const [isActive, setIsActive] = useState(true)
  const [inputId, setInputId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [versionId, setVersionId] = useState<number>(0)
  const [highlightHeader, setHighlightHeader] = useState(false)
  const [onHeaderClick, setOnHeaderClick] = useState<any>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState("")

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
      setPreviewId(dataFusion?.clone_table(inputId, id))
    }
  }, [ id, inputId, dataFusion ])

  useLayoutEffect(() => {
    if (settingsRef.current) {
      const rect = settingsRef.current.getBoundingClientRect()

      setDimensions({
        height: rect.height,
        width: rect.width
      })
    }
  }, [settingsRef]);

  const title = React.useMemo(() => {
    const maybe_name = metadata[id]
    const name = maybe_name ? keyStore?.decrypt_metadata(maybe_name) : id

    setNewTitle(name)

    return name
  }, [ id, keyStore, metadata ])

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
    // Cleanup intermediate table
    if (previewId) {
      dataFusion?.drop_table(previewId)
    }

    setIsActive(false)
    onClose()
  }

  const handleHeaderCallback = React.useCallback((fn: any) => {
    setOnHeaderClick(() => fn)
    setHighlightHeader(!!fn)
  }, [ setOnHeaderClick, setHighlightHeader ])

  const onTitleChange = React.useCallback((e: any) => {
    e.preventDefault()

    dispatch(updateMetadata({
      id: id,
      workspace: "default",
      metadata: keyStore?.encrypt_metadata(newTitle)
    }))

    setIsEditingTitle(false)

  }, [ id, newTitle, setIsEditingTitle, dispatch, keyStore ])

  const renderTitle = React.useMemo(() => {
    if (isEditingTitle) {
      return (
        <div className="modal-card-title">
          <form onSubmit={onTitleChange}>
            <input className="input py-0" type="text" placeholder={title} value={newTitle} style={{width: "30%"}} onChange={(e: any) => setNewTitle(e.target.value)}/>

            <button type="submit" className="button is-info" onClick={onTitleChange}>
              <span className="icon is-small" >
                <FontAwesomeIcon icon={faCheck} size="sm"/>
              </span>
            </button>
          </form>
        </div>
      )
    } else {
      return (
        <p className="modal-card-title" onClick={() => setIsEditingTitle(true)}>
          {title}
        </p>
      )
    }
  }, [ title, isEditingTitle, newTitle, setNewTitle, onTitleChange ])

  return (
    <div className={"p-modal " + (isActive ? "is-active" : "")}>
      <div className="modal-background"></div>
      <div className="p-modal-card">
        <header className="modal-card-head">
          { renderTitle }
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
              id={id}
              wal={wal}
              tableId={previewId}
              columnNames={columnNames}
              schema={collection?.schema}
              dimensions={dimensions}
              setHeaderCallback={handleHeaderCallback}
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
              highlightHeader={highlightHeader}
              onHeaderClick={onHeaderClick}
            />
          : null
          }

        </section>
      </div>
    </div>
  )
}

export default Transformer

