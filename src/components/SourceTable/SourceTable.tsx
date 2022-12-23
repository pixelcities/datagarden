import React, { FC, useRef, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faFileCsv } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectUsers, selectMetadataById, selectSourceById, selectCollectionById, selectActiveDataSpace } from 'state/selectors'
import { updateSource, deleteSource, updateCollection, updateMetadata, shareSecret } from 'state/actions'

import { Source, Collection, Schema, User } from 'types'

import DataTable from 'components/DataTable'
import ShareCard from 'components/ShareCard'
import Onboarding from './Onboarding'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { loadRemoteTable } from 'utils/loadRemoteTable'

import './SourceTable.sass'


interface SourceTableProps {
  id: string,
  uri?: string,
  schema: Schema,
  onClose: () => void,
  isCollection?: boolean
}

const SourceTable: FC<SourceTableProps> = (props) => {
  const { schema, onClose, isCollection } = props

  const titleRef = useRef<string>("")

  const [title, setTitle] = useState(props.id)
  const [userSearch, setUserSearch] = useState("")

  const [handle, setHandle] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [tableId, setTableId] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const { user } = useAuthContext();
  const { keyStore, protocol } = useKeyStoreContext();
  const { arrow, dataFusion, loadDataFusion } = useDataFusionContext();
  useEffect(() => loadDataFusion(), [ loadDataFusion ])

  useEffect(() => {
    // If the table had been loaded before we can just skip ahead
    if (props.id && !tableId && dataFusion?.table_exists(props.id)) {
      setTableId(props.id)

    // Pull it in instead
    } else if (props.id && props.uri && !tableId) {
      loadRemoteTable(props.id, props.uri, schema, user, arrow, dataFusion, keyStore)
        .then(() => setTableId(props.id))
        .catch(() => {}) // probably already loaded
    }
  }, [props, schema, user, arrow, dataFusion, keyStore, tableId])

  const dispatch = useAppDispatch()
  const users = useAppSelector(selectUsers)
  const titleMetadata = useAppSelector(state => selectMetadataById(state, props.id))
  const collection = useAppSelector(state => selectCollectionById(state, props.id))
  const source = useAppSelector(state => selectSourceById(state, props.id))
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => {
    if (titleMetadata) {
      setTitle(keyStore?.decrypt_metadata(dataSpace?.key_id, titleMetadata.metadata))
    }
  }, [ dataSpace, titleMetadata, keyStore ])

  const renderShares = React.useMemo(() => {
    let res

    if (source || collection) {
      let schema = source?.schema || collection?.schema

      const shares = schema?.shares.filter(share => share.type !== "public" && share.principal)
      res = shares?.map(share => {
        const user_share = users.find(u => u.id === share.principal)

        if (share.principal && user_share) {
          return <ShareCard key={share.principal} principal={share.principal} user={user_share} isSelf={user?.id === user_share.id} />
        }
        return <></>
      })
    }

    return res
  }, [ source, collection, users, user ] )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setTitle(value)
    titleRef.current = value

    // Push the title update, but not for every letter change
    if (!handle && tableId) {
      setHandle(window.setTimeout(() => {

        dispatch(updateMetadata({
          id: tableId,
          workspace: "default",
          metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, titleRef.current)
        }))

        setHandle(0)
      }, 3000))
    }
  }

  const handleClose = React.useCallback(() => {
    setIsActive(false)
    onClose()
  }, [ setIsActive, onClose ])

  const shareSchemaWithUser = React.useCallback((selectedUser: User) => {
    const share = {
      type: "full",
      principal: selectedUser.id
    }

    if (user && (source || collection)) {
      const schema = collection?.schema || source?.schema

      if (schema) {
        protocol?.encrypt(selectedUser.id, keyStore?.get_key(schema.key_id)).then((secret: string) => {
          dispatch(shareSecret({
            key_id: schema.key_id,
            owner: user.id,
            receiver: selectedUser.id,
            ciphertext: secret
          }))
        })
      }

      if (isCollection && collection) {
        dispatch(updateCollection({...collection, ...{
          schema: {...collection.schema, ...{
            shares: [...collection.schema.shares, share]
          }}
        }}))

      } else if (source) {
        dispatch(updateSource({
          id: source.id,
          workspace: source.workspace,
          type: source.type,
          uri: source.uri,
          schema: {...source.schema, ...{
            shares: [...source.schema.shares, share]
          }},
          is_published: source.is_published
        }))
      }
    }

    setUserSearch("")
  }, [ source, collection, isCollection, user, keyStore, protocol, dispatch ])

  const renderUserDropdown = React.useMemo(() => {
    const filteredUsers = userSearch !== "" ? users.filter(u => u.id !== user?.id && (u.email.indexOf(userSearch) !== -1 || (u.name?.indexOf(userSearch) ?? -1) !== -1)) : []
    const userItems = filteredUsers.slice(0, 5).map(u => {
      return (
        <div className="dropdown-item" key={u.id} style={{cursor: "pointer"}} onClick={() => shareSchemaWithUser(u)}>
          <p> {u.email} </p>
        </div>
      )
    })

    return userItems
  }, [ user, users, userSearch, shareSchemaWithUser ])


  const renderPublish = React.useMemo(() => {
    const handlePublish = (source: Source | undefined) => {
      if (source) {
        dispatch(updateSource({...source, ...{
          is_published: !source.is_published
        }}))
      }
    }

    return (
      <div className="field">
        <label id="publish" className="label pb-2"> Release process </label>

        <div onClick={() => handlePublish(source)}>
          <input type="checkbox" className="switch" checked={source?.is_published ?? false} readOnly={true} />
          <label>
            { source?.is_published ? "Published" : "Unpublished" }
          </label>
        </div>
      </div>
    )
  }, [ source, dispatch ])

  const renderDelete = React.useMemo(() => {
    const handleDelete = (source: Source | undefined) => {
      if (source) {
        dispatch(deleteSource({
          id: source.id,
          workspace: source.workspace
        }))
        handleClose()
      }
    }

    if (!isCollection) {
      return (
        <div className="column is-one-quarter">
          <button className="button is-danger is-outlined is-pulled-right mr-3" onClick={() => handleDelete(source)}> Delete </button>
        </div>
      )
    } else {
      return (
        <></>
      )
    }
  }, [ source, isCollection, dispatch, handleClose ])

  const renderDownloadButton = React.useMemo(() => {
    const handleDownload = (collection: Collection | undefined) => {
      if (collection) {
        const csv = dataFusion?.export_csv(collection.id)
        const blob = new Blob([csv], { type: "text/csv" })

        setDownloadUrl(window.URL.createObjectURL(blob))
      }
    }

    if (isCollection) {
      return (
        <div className="column is-one-quarter">
          <button className="button is-primary is-outlined is-pulled-right mr-3" onClick={() => handleDownload(collection)}> Download </button>
        </div>
      )
    } else {
      return (
        <></>
      )
    }
  }, [ collection, isCollection, dataFusion ])

  const handlePostDownload = (url: string) => {
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 5000)

    setDownloadUrl(null)
  }

  const renderDownloadModal = React.useMemo(() => {
    if (downloadUrl) {
      return (
        <div id="test123" className="modal is-active">
          <div className="modal-background"></div>
          <div className="modal-content">
            <div className="box">
              <p className="buttons">
                <a className="button is-large" href={downloadUrl} download={title + ".csv"} onClick={() => handlePostDownload(downloadUrl)}>
                  <span className="icon is-medium">
                    <FontAwesomeIcon icon={faFileCsv} color="#4f4f4f" size="lg"/>
                  </span>
                </a>
              </p>
            </div>
          </div>

           <button className="modal-close is-large" aria-label="close" onClick={() => setDownloadUrl(null)}></button>
        </div>
      )
    }
  }, [ downloadUrl, setDownloadUrl, title ])

  const renderSettings = (
    <div className="is-relative px-4 py-4" style={{height: "100%"}}>
      <div className="field">
        <label className="label">Title</label>
        <div className="control">
          <input className="input" type="text" placeholder={title} value={title} onChange={handleTitleChange} />
        </div>
      </div>

      <div className="field">
        <label className="label">Privacy Controls</label>
        <div className="control has-icons-left">
          <div className="select is-fullwidth">
            <select>
              <option>Private</option>
            </select>
          </div>
          <div className="icon is-small is-left pb-2">
            <FontAwesomeIcon icon={faKey} size="sm"/>
          </div>
        </div>
      </div>

      <div className="field">
        <label id="share-intro" className="label">Explicit shares</label>
          <div className="control pb-5">
            <div className={"dropdown" + (renderUserDropdown.length > 0 ? " is-active" : "")} style={{width: "100%"}}>
              <div className="dropdown-trigger" style={{width: "100%"}}>
                <input className="input" type="text" placeholder="Add people and organisations" value={userSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserSearch(e.target.value)}/>
              </div>

              <div className="dropdown-menu" id="dropdown-menu" role="menu" style={{width: "100%"}}>
                <div className="dropdown-content">
                  { renderUserDropdown }
                </div>
              </div>

            </div>
          </div>

        { renderShares }
      </div>

      { !(isCollection === true) && renderPublish }

      <div className="settings-footer">
        <div className="columns">
          <div className="column is-three-quarters">
            <p className="fineprint-label ml-3" style={{position: "absolute", bottom: "0px"}}>
              Last updated at: { source?.date || collection?.date }
            </p>
          </div>

          { renderDelete }
          { renderDownloadButton }

        </div>
      </div>

    </div>
  )

  return (
    <div className={"p-modal " + (isActive ? "is-active" : "")}>
      <div className="modal-background"></div>

      { !(isCollection === true) ? <Onboarding /> : null }

      { downloadUrl && renderDownloadModal }

      <div id="data-intro" className="p-modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" aria-label="close" onClick={handleClose}></button>
        </header>

        <section className="modal-card-body is-relative px-0 py-0">
          { tableId ?
            <DataTable
              id={tableId}
              schema={schema}
              interactiveHeader={true}
            />
          :
            <div className="table-loader">
              <progress className="progress is-primary" max="100">60%</progress>
            </div>
          }

          <div className="settings-container">
            { renderSettings }
          </div>

        </section>
      </div>
    </div>
  )
}

export default SourceTable

