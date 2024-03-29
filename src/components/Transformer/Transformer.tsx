import React, { FC, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectMetadataMap, selectConceptMap, selectTransformerById, selectCollectionsByIds, selectActiveDataSpace } from 'state/selectors'
import { updateMetadata, sendLocalNotification } from 'state/actions'

import { Schema, WAL, ConceptA } from 'types'

import DataTable from 'components/DataTable'
import TransformerSettings from './TransformerSettings'


import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { emptyTaxonomy } from 'utils/taxonomy'
import { isAuthorized } from 'utils/helpers'

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
  const [leftInputId, setLeftInputId] = useState<string | null>(null)
  const [rightInputId, setRightInputId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewSchema, setPreviewSchema] = useState<Schema | null>(null)
  const [versionId, setVersionId] = useState<number>(0)
  const [highlightHeader, setHighlightHeader] = useState(false)
  const [onHeaderClick, setOnHeaderClick] = useState<any>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [error, setError] = useState("")

  const { user } = useAuthContext();
  const { keyStore } = useKeyStoreContext();
  const { arrow, dataFusion, loadDataFusion } = useDataFusionContext();

  const transformer = useAppSelector(state => selectTransformerById(state, id))
  const inputCollections = useAppSelector(state => selectCollectionsByIds(state, collections))
  const metadata = useAppSelector(selectMetadataMap)
  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => loadDataFusion(), [ loadDataFusion ])
  useEffect(() => {
    if (!leftInputId) {
      Promise.all(inputCollections.map((collection) => {
        return new Promise<void>((resolve, reject) => {
          if (isAuthorized(user, collection.schema)) {
            if (dataFusion?.table_exists(collection.id)) {
              resolve()

            } else {
              loadRemoteTable(collection.id, collection.uri, collection.schema, user, arrow, dataFusion, keyStore)
                .then(() => resolve())
                .catch((e) => console.log("Error loading table:", e))
            }
          } else {
            reject()
          }
        })
      })).then(() => {
        setLeftInputId(inputCollections[0].id)

        if (inputCollections.length === 2) {
          setRightInputId(inputCollections[1].id)
        }
      }).catch(() => onClose())
    }
  }, [inputCollections, user, arrow, dataFusion, keyStore, leftInputId, onClose])

  useEffect(() => {
    if (rightInputId) {
      const leftSchema = inputCollections[0].schema
      const rightSchema = inputCollections[1].schema

      // Dummy merge the two schemas for preview purposes
      setPreviewSchema({
        id: id,
        key_id: "",
        column_order: [...leftSchema.column_order, ...rightSchema.column_order],
        columns: [...leftSchema.columns, ...rightSchema.columns],
        shares: [...leftSchema.shares, ...rightSchema.shares],
        tag: ""
      })

    } else {
      setPreviewSchema(inputCollections[0].schema)
    }

    if (leftInputId) {
      setPreviewId(dataFusion?.clone_table(leftInputId, id))
    }
  }, [ id, leftInputId, rightInputId, inputCollections, dataFusion ])

  useEffect(() => {
    if (transformer?.error) {
      setError(transformer?.error)
    }
  }, [ transformer ])
  useEffect(() => {
    if (error !== "") {
      dispatch(sendLocalNotification({
        id: crypto.randomUUID(),
        type: "error",
        message: error,
        is_urgent: true,
        is_local: true
      }))
    }
  }, [ error, dispatch ])

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

  const columns = React.useMemo(() => {
    let attributes: {[key: string]: ConceptA} = {};

    inputCollections.forEach(collection => {
      collection.schema.columns.forEach(column => {
        const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[column.concept_id])

        if (maybe_concept) {
          attributes[column.id] = maybe_concept
        } else {
          console.log(`Cannot find concept for column "${column.id}"`)
        }
      })
    })

    return attributes
  }, [ dataSpace, inputCollections, concepts ])

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

  return (
    <div className={"p-modal " + (isActive ? "is-active" : "")}>
      <div className="modal-background"></div>
      <div className="p-modal-card">
        <header className="modal-card-head">
          { renderTitle }
          <button className="delete" aria-label="close" onClick={handleClose}></button>
        </header>

        <section className="modal-card-body is-relative px-0 py-0">
          { leftInputId && inputCollections[0] ?
            <DataTable
              id={leftInputId}
              schema={inputCollections[0].schema}
              interactiveHeader={false}
              style={{width: "40%", height: (rightInputId ? "50%" : "100%")}}
            />
          : null
          }

          { rightInputId && inputCollections[1] ?
            <DataTable
              id={rightInputId}
              schema={inputCollections[1].schema}
              interactiveHeader={false}
              style={{width: "40%", top: "50%", height: "50%"}}
            />
          : null
          }

          <div ref={settingsRef} className="transformer-control-container">
            <TransformerSettings
              id={id}
              type={transformer?.type}
              wal={wal}
              tableId={previewId}
              leftId={leftInputId}
              rightId={rightInputId}
              columns={columns}
              schemas={inputCollections.map(collection => collection.schema)}
              dimensions={dimensions}
              setHeaderCallback={handleHeaderCallback}
              setSchemaCallback={setPreviewSchema}
              onComplete={() => setVersionId(versionId + 1)}
              onClose={handleClose}
            />
          </div>

          { previewId && previewSchema && inputCollections ?
            <DataTable
              id={previewId}
              schema={previewSchema}
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

