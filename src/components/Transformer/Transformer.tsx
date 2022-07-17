import React, { FC, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectMetadataMap, selectCollectionById, selectActiveDataSpace } from 'state/selectors'
import { updateMetadata } from 'state/actions'

import { WAL } from 'types'

import DataTable from 'components/DataTable'
import TransformerSettings from './TransformerSettings'


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
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => loadDataFusion(), [ loadDataFusion ])
  useEffect(() => {
    if (collection && !inputId && dataFusion?.table_exists(collection.id)) {
      setInputId(collection.id)

    } else if (collection?.id && collection.uri && !inputId) {
      loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore).then(() => setInputId(collection.id))
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
    const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : id

    setNewTitle(name)

    return name
  }, [ id, dataSpace, keyStore, metadata ])

  const columnNames = React.useMemo(() => {
    let attributes: {[key: string]: string} = {};

    if (collection) {
      collection.schema.columns.forEach(column => {
        const maybe_name = metadata[column.id]
        const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : column.id;

        attributes[column.id] = name
      })
    }

    return attributes
  }, [ keyStore, dataSpace, collection, metadata ])

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
      metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, newTitle)
    }))

    setIsEditingTitle(false)

  }, [ id, newTitle, dataSpace, setIsEditingTitle, dispatch, keyStore ])

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

  const containerHeight = React.useMemo(() => {
    if (wal) {
      const nrIdentifiers = Object.keys(wal.identifiers).length
      const nrValues = Object.keys(wal.values).length
      const nrTransactions = wal.transactions.length

      return 700 + (nrIdentifiers + nrValues + nrTransactions) * 33
    } else {
      return 700 + 2 * 33 // default
    }
  }, [ wal ])

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

          <div ref={settingsRef} className="transformer-control-container" style={{minHeight: containerHeight}}>
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

