import React, { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import Chart from './charts/Chart'
import Maps from './maps/Maps'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectMetadataMap, selectConceptMap, selectActiveDataSpace, selectCollectionById, selectWidgetById } from 'state/selectors'
import { updateMetadata } from 'state/actions'

import { useKeyStoreContext } from 'contexts'
import { useDataFusionContext } from 'contexts'
import { useAuthContext } from 'contexts'

import { loadRemoteTable } from 'utils/loadRemoteTable'
import { emptyTaxonomy } from 'utils/taxonomy'
import { isAuthorized } from 'utils/helpers'


interface WidgetProps {
  id: string,
  collection?: string,
  onClose: () => void
}

const Widget: FC<WidgetProps> = ({ id, collection, onClose }) => {
  const dispatch = useAppDispatch()

  const [isActive, setIsActive] = useState(true)
  const [inputId, setInputId] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const { user } = useAuthContext()
  const { arrow, dataFusion, loadDataFusion } = useDataFusionContext();
  const { keyStore } = useKeyStoreContext();

  const widget = useAppSelector(state => selectWidgetById(state, id))
  const inputCollection = useAppSelector(state => selectCollectionById(state, collection || ""))
  const metadata = useAppSelector(selectMetadataMap)
  const concepts = useAppSelector(selectConceptMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => loadDataFusion(), [ loadDataFusion ])
  useEffect(() => {
    if (!inputId && inputCollection) {
      if (isAuthorized(user, inputCollection.schema)) {
        if (dataFusion?.table_exists(inputCollection.id)) {
          setInputId(inputCollection.id)
        } else {
          loadRemoteTable(inputCollection.id, inputCollection.uri, inputCollection.schema, user, arrow, dataFusion, keyStore).then(() => setInputId(inputCollection.id))
        }
      } else {
        onClose()
      }
    }
  }, [inputCollection, user, arrow, dataFusion, keyStore, inputId, onClose])

  const onTitleChange = React.useCallback((e: any) => {
    e.preventDefault()

    dispatch(updateMetadata({
      id: id,
      workspace: "default",
      metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, newTitle)
    }))

    setIsEditingTitle(false)

  }, [ id, newTitle, dataSpace, setIsEditingTitle, dispatch, keyStore ])

  const title = React.useMemo(() => {
    const maybe_name = metadata[id]
    const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : id

    setNewTitle(name)

    return name
  }, [ id, dataSpace, keyStore, metadata ])

  const columnNames = React.useMemo(() => {
    let attributes: {[key: string]: string} = {};

    if (inputCollection) {
      inputCollection.schema.columns.forEach(column => {
        const maybe_concept = emptyTaxonomy(dataSpace?.key_id).deserialize(concepts[column.concept_id])
        const name = maybe_concept ? maybe_concept.name : column.id

        attributes[column.id] = name
      })
    }

    return attributes
  }, [ dataSpace, inputCollection, concepts ])

  const handleClose = () => {
    setIsActive(false)
    onClose()
  }

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

  const renderWidget = React.useMemo(() => {
    if (inputId && inputCollection) {
      if (widget?.type === "chart") {
        return (
          <Chart
            id={id}
            collectionId={inputId}
            columnNames={columnNames}
            schema={inputCollection.schema}
            settings={widget.settings}
            access={widget.access}
            isPublished={widget.is_published}
          />
        )
      } else if (widget?.type === "map") {
        return (
          <Maps
            id={id}
            collectionId={inputId}
            columnNames={columnNames}
            schema={inputCollection.schema}
            settings={widget.settings}
            access={widget.access}
            isPublished={widget.is_published}
          />
        )
      }
    }
  }, [ id, widget, inputId, columnNames, inputCollection ])

  return (
    <div className={"p-modal " + (isActive ? "is-active" : "")}>
      <div className="modal-background"></div>
      <div className="p-modal-card">
        <header className="modal-card-head">
          { renderTitle }
          <button className="delete" aria-label="close" onClick={handleClose}></button>
        </header>

        <section className="modal-card-body is-relative px-0 py-0">
          { renderWidget }
        </section>
      </div>
    </div>
  )
}

export default Widget

