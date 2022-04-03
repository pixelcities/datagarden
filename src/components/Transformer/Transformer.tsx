import React, { FC, useState, useEffect } from 'react';

import { useAppSelector } from 'hooks'
import { selectMetadataMap, selectCollectionById } from 'state/selectors'

import { Schema } from 'types'

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
  onClose: () => void
}

interface TransformerSettingsProps {
  tableId: string | null,
  columnNames: {[key: string]: string},
  schema?: Schema,
  onComplete: any
}

const TransformerSettings: FC<TransformerSettingsProps> = ({ tableId, columnNames, schema, onComplete }) => {
  const [query, setQuery] = useState("SELECT * FROM \"table\";")

  const { dataFusion } = useDataFusionContext();

  useEffect(() => {
    if (tableId) {
      setQuery("SELECT * FROM \"" + tableId + "\";")
    }
  }, [ tableId ])

  const handleQueryExecute = (e: any) => {
    e.preventDefault()

    console.log(query)

    if (tableId) {
      dataFusion?.query(tableId, query).then(() => {
        setQuery("")

        onComplete()
      })
    }
  }

  return (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>
      <form onSubmit={handleQueryExecute}>

        <div className="field">
          <label className="label">Query</label>
          <div className="control">
            <input className="input" type="text" placeholder={query} value={query} onChange={(e: any) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <input type="submit" className="button is-primary" value="Query" />
          </div>
        </div>
      </form>
    </div>
  )
}

const Transformer: FC<TransformerProps> = ({id, collections, transformers, onClose}) => {
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

          <div className="transformer-control-container">
            <TransformerSettings
              tableId={previewId}
              columnNames={columnNames}
              schema={collection?.schema}
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

