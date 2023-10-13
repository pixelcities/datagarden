import React, { FC, useRef, useEffect, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faKey, faFileCsv } from '@fortawesome/free-solid-svg-icons'
import { Mutex } from 'async-mutex'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectUsers, selectMetadataById, selectSourceById, selectCollectionById, selectActiveDataSpace, selectDataURIById } from 'state/selectors'
import { updateSource, updateSourceSchema, deleteSource, updateCollectionSchema, updateMetadata, setCollectionColor, shareSecret, sendLocalNotification, createDataURI, updateSourceURI } from 'state/actions'

import { Source, Collection, Schema, User } from 'types'

import DataTable from 'components/DataTable'
import ShareCard from 'components/ShareCard'
import ColorPicker from 'components/ColorPicker'
import Onboarding from './Onboarding'

import { useDataFusionContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { getColumnIds, toRelativeTime } from 'utils/helpers'
import { loadRemoteTable } from 'utils/loadRemoteTable'
import { signSchema, verifySchema } from 'utils/integrity'
import { writeRemoteTable } from 'utils/writeRemoteTable'

import './SourceTable.sass'


interface SourceTableProps {
  id: string,
  uri?: [string, string],
  schema: Schema,
  onClose: () => void,
  isCollection?: boolean
}

const SourceTable: FC<SourceTableProps> = (props) => {
  const { schema, onClose, isCollection } = props

  const titleRef = useRef<string>("")
  const mutex = useMemo(() => new Mutex(), [])

  const [title, setTitle] = useState(props.id)
  const [userSearch, setUserSearch] = useState("")

  const [handle, setHandle] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [tableId, setTableId] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [versionId, setVersionId] = useState(1)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [schemaIsValid, setSchemaIsValid] = useState(false)

  const { user } = useAuthContext();
  const { keyStore, protocol } = useKeyStoreContext();
  const { arrow, dataFusion, loadDataFusion } = useDataFusionContext();
  useEffect(() => loadDataFusion(), [ loadDataFusion ])

  useEffect(() => {
    if (getColumnIds(user, schema).length > 0) {
      // If the table had been loaded before we can just skip ahead
      if (props.id && !tableId && dataFusion?.table_exists(props.id)) {
        setTableId(props.id)

      // Pull it in instead
      } else if (props.id && props.uri && !tableId) {
        loadRemoteTable(props.id, props.uri, schema, user, arrow, dataFusion, keyStore)
          .then(() => setTableId(props.id))
          .catch(() => {}) // probably already loaded
      }

    // Special case: nothing to load / see
    } else {
      setTableId(props.id)
    }
  }, [props, schema, user, arrow, dataFusion, keyStore, tableId])

  const dispatch = useAppDispatch()
  const users = useAppSelector(selectUsers)
  const titleMetadata = useAppSelector(state => selectMetadataById(state, props.id))
  const collection = useAppSelector(state => selectCollectionById(state, props.id))
  const source = useAppSelector(state => selectSourceById(state, props.id))
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const dataURI = useAppSelector(state => selectDataURIById(state, props.id))

  useEffect(() => {
    if (titleMetadata) {
      setTitle(keyStore?.decrypt_metadata(dataSpace?.key_id, titleMetadata.metadata))
    }
  }, [ dataSpace, titleMetadata, keyStore ])

  useEffect(() => {
    const maybeSchema = source?.schema || collection?.schema
    if (maybeSchema) {
      verifySchema(maybeSchema, keyStore?.get_key(maybeSchema.key_id)).then(isValid => {
        setSchemaIsValid(isValid)

        if (!isValid) {
          console.error("Invalid schema signature")
        }
      })
    }
  }, [ source?.schema, collection?.schema, keyStore ])

  const rotateKeys = async (source: Source, collection: Collection | undefined, user: User, keyStore: any, protocol: any, dispatch: any) => {
    let keymap: {[key: string]: string} = {}
    let shareHistory: string[] = []

    const schema_key_id = await keyStore?.generate_key(16)
    keymap[source.schema.key_id] = schema_key_id

    for (const share of source.schema.shares) {
      if (share.principal && share.principal !== user.id) {
        const receiver = share.principal
        const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(schema_key_id))

        dispatch(shareSecret({
          key_id: schema_key_id,
          owner: user.id,
          receiver: receiver,
          ciphertext: ciphertext
        }))

        shareHistory.push(receiver + schema_key_id)
      }
    }

    let columns = []

    for (const column of source.schema.columns) {
      const key_id = await keyStore?.generate_key(16)
      keymap[column.key_id] = key_id

      for (const share of column.shares) {
        if (share.principal && share.principal !== user.id) {
          const receiver = share.principal
          const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

          dispatch(shareSecret({
            key_id: key_id,
            owner: user.id,
            receiver: receiver,
            ciphertext: ciphertext
          }))

          shareHistory.push(receiver + key_id)
        }
      }

      columns.push({...column, ...{
        key_id: key_id,
      }})
    }

    const schema = {...source.schema, ...{
      key_id: schema_key_id,
      columns: columns
    }}

    const signedSchema = await signSchema(JSON.parse(JSON.stringify(schema)), keyStore?.get_key(schema_key_id))

    dispatch(updateSourceSchema({
      id: source.id,
      workspace: source.workspace,
      schema: signedSchema
    }))

    // Also update the linked collection schema, if it exists
    if (collection) {
      for (const share of collection.schema.shares) {
        if (share.principal && share.principal !== user.id) {
          const receiver = share.principal
          const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(schema_key_id))

          if (shareHistory.indexOf(receiver + schema_key_id) === -1) {
            dispatch(shareSecret({
              key_id: schema_key_id,
              owner: user.id,
              receiver: receiver,
              ciphertext: ciphertext
            }))
          }
        }
      }

      let columns = []

      for (const column of collection.schema.columns) {
        const key_id = keymap[column.key_id]

        for (const share of column.shares) {
          if (share.principal && share.principal !== user.id) {
            const receiver = share.principal
            const ciphertext = await protocol?.encrypt(receiver, keyStore?.get_key(key_id))

            if (shareHistory.indexOf(receiver + key_id) === -1) {
              dispatch(shareSecret({
                key_id: key_id,
                owner: user.id,
                receiver: receiver,
                ciphertext: ciphertext
              }))
            }
          }
        }

        columns.push({...column, ...{
          key_id: key_id,
        }})
      }

      const collectionSchema = {...collection.schema, ...{
        key_id: schema_key_id,
        columns: columns
      }}

      const signedCollectionSchema = await signSchema(JSON.parse(JSON.stringify(collectionSchema)), keyStore?.get_key(schema_key_id))

      dispatch(updateCollectionSchema({
        id: collection.id,
        workspace: collection.workspace,
        schema: signedCollectionSchema
      }))
    }

    return signedSchema
  }

  useEffect(() => {
    mutex.runExclusive(async () => {
      if (uploadId && source && dataURI && source.uri?.[0] !== dataURI.uri && user && schemaIsValid) {
        if (dataFusion?.table_exists(uploadId)) {
          const uri = [dataURI.uri, dataURI.tag] as [string, string]

          dataFusion?.drop_table(source.id)
          dataFusion?.move_table(uploadId, source.id)

          rotateKeys(source, collection, user, keyStore, protocol, dispatch).then(schema => {
            writeRemoteTable(source.id, uri, schema, user, arrow, dataFusion, keyStore).then(() => {
              setUploadId(null)
              setVersionId(versionId + 1)

              dispatch(updateSourceURI({
                id: source.id,
                workspace: source.workspace,
                uri: uri
              }))
            })
          })
        }
      }
    })
  }, [ source, collection, versionId, uploadId, dataURI, schemaIsValid, user, dispatch, arrow, dataFusion, keyStore, protocol, mutex ])

  const renderShares = useMemo(() => {
    let res

    if (source || collection) {
      let shareSchema = isCollection ? collection?.schema : source?.schema

      const shares = shareSchema?.shares.filter(share => share.type !== "public" && share.principal)
      const columnShares = shareSchema?.columns.reduce<string[]>((acc, column) => [...acc, ...column.shares.map(x => x.principal).filter((x): x is string => !!x)], []) || []

      const handleDelete = (principal: string) => {
        if (isCollection && collection && schemaIsValid) {
          signSchema({...collection.schema, ...{
            shares: collection.schema.shares.filter(share => share.principal !== principal)
          }}, keyStore?.get_key(collection.schema.key_id)).then(signedSchema => {
            dispatch(updateCollectionSchema({
              id: collection.id,
              workspace: collection.workspace,
              schema: signedSchema
            }))
          })

        } else if (source && schemaIsValid) {
          signSchema({...source.schema, ...{
            shares: source.schema.shares.filter(share => share.principal !== principal)
          }}, keyStore?.get_key(source.schema.key_id)).then(signedSchema => {
            dispatch(updateSourceSchema({
              id: source.id,
              workspace: source.workspace,
              schema: signedSchema
            }))
          })
        }
      }

      res = shares?.map(share => {
        const user_share = users.find(u => u.id === share.principal)

        if (share.principal) {
          const canDelete = columnShares.indexOf(share.principal) === -1 && share.type !== "owner"

          return <ShareCard key={share.principal} principal={share.principal} user={user_share} isSelf={user?.id === user_share?.id} onDelete={canDelete ? handleDelete : undefined} />
        }
        return <></>
      })
    }

    return res
  }, [ source, collection, isCollection, users, user, keyStore, schemaIsValid, dispatch ] )

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

  const handleColorChange = (color: string) => {
    if (collection) {
      dispatch(setCollectionColor({
        id: collection.id,
        workspace: collection.workspace,
        color: color
      }))
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
      const schema = isCollection ? collection?.schema : source?.schema

      if (schema && schemaIsValid) {
        protocol?.encrypt(selectedUser.id, keyStore?.get_key(schema.key_id)).then((secret: string) => {
          dispatch(shareSecret({
            key_id: schema.key_id,
            owner: user.id,
            receiver: selectedUser.id,
            ciphertext: secret
          }))
        })
      }

      if (isCollection && collection && schemaIsValid) {
        if (!collection.schema.shares.find(s => s.principal === share.principal)) {
          signSchema({...collection.schema, ...{
            shares: [...collection.schema.shares, share]
          }}, keyStore?.get_key(collection.schema.key_id)).then(signedSchema => {
            dispatch(updateCollectionSchema({
              id: collection.id,
              workspace: collection.workspace,
              schema: signedSchema
            }))
          })
        }

      } else if (source && schemaIsValid) {
        if (!source.schema.shares.find(s => s.principal === share.principal)) {
          signSchema({...source.schema, ...{
            shares: [...source.schema.shares, share]
          }}, keyStore?.get_key(source.schema.key_id)).then(signedSchema => {
            dispatch(updateSource({
              id: source.id,
              workspace: source.workspace,
              type: source.type,
              uri: source.uri,
              schema: signedSchema,
              is_published: source.is_published
            }))
          })
        }
      }
    }

    setUserSearch("")
  }, [ source, collection, isCollection, schemaIsValid, user, keyStore, protocol, dispatch ])

  const renderUserDropdown = useMemo(() => {
    const filteredUsers = userSearch !== "" ? users.filter(u => u.id !== user?.id && (u.email.toLowerCase().indexOf(userSearch.toLowerCase()) !== -1 || (u.name?.toLowerCase().indexOf(userSearch.toLowerCase()) ?? -1) !== -1)) : []
    const userItems = filteredUsers.slice(0, 5).map(u => {
      return (
        <div className="dropdown-item" key={u.id} style={{cursor: "pointer"}} onClick={() => shareSchemaWithUser(u)}>
          <p> {u.email === "[REDACTED]" ? u.name : u.email} </p>
        </div>
      )
    })

    return userItems
  }, [ user, users, userSearch, shareSchemaWithUser ])

  const renderRelease = useMemo(() => {
    const handlePublish = (source: Source | undefined) => {
      if (source) {
        dispatch(updateSource({...source, ...{
          is_published: !source.is_published
        }}))
      }
    }

    const handleUpload = (e: any) => {
      const f = e.target.files[0];

      if (source) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const buf = ev?.target?.result

          if (!buf || typeof(buf) === "string") {
            return
          }

          const data = new Uint8Array(buf)
          const tempId = (source.type === "csv") ? dataFusion.load_csv(data, "") : dataFusion.load_sheet(data, "")

          const _schema = dataFusion.get_schema(source.id)
          const orderedFields = _schema.fields.sort((a: any, b: any) => schema.column_order.indexOf(a.name) > schema.column_order.indexOf(b.name))

          const originalSchema = {..._schema, ...{fields: orderedFields}}
          const newSchema = dataFusion.get_schema(tempId)

          const originalTypes: string[] = originalSchema.fields.map((field: any) => field.type.name)
          const newTypes: string[] = newSchema.fields.map((field: any) => field.type.name)

          const newSchemaIsEqual = originalTypes.reduce((a, x, i) => a && x === newTypes[i], true)

          if (newSchemaIsEqual) {
            dataFusion.update_schema(tempId, originalSchema)

            setUploadId(tempId)
            dispatch(createDataURI({
              id: source.id,
              workspace: "default",
              type: "source"
            }))

          } else {
            dispatch(sendLocalNotification({
              id: crypto.randomUUID(),
              type: "error",
              message: "Columns do not match the original source",
              is_urgent: true,
              is_local: true
            }))
          }
        }
        reader.readAsArrayBuffer(f)
      }
    }

    return (
      <div className="field">
        <label id="publish" className="label pb-2"> Release process </label>

        <div className="file is-boxed is-small pb-3">
          <label className="file-label">
            <input className="file-input" type="file" name="upload" onChange={handleUpload} accept={source?.type === "csv" ? ".csv" : ".xls,.xlsx,.ods"} />
            <span className="file-cta">
              <span className="file-icon">
                <FontAwesomeIcon icon={faUpload} size="lg"/>
              </span>
              <span className="file-label">
                Upload new version
              </span>
            </span>
          </label>
        </div>

        <div onClick={() => handlePublish(source)}>
          <input type="checkbox" className="switch" checked={source?.is_published ?? false} readOnly={true} />
          <label>
            { source?.is_published ? "Published" : "Unpublished" }
          </label>
        </div>
      </div>
    )
  }, [ source, schema, dispatch, dataFusion ])

  const renderDelete = useMemo(() => {
    const handleDelete = (source: Source | undefined) => {
      if (source && window.confirm("Are you sure you want to delete this source?")) {
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
          <button className="button is-danger is-outlined is-pulled-right" onClick={() => handleDelete(source)}> Delete </button>
        </div>
      )
    } else {
      return (
        <></>
      )
    }
  }, [ source, isCollection, dispatch, handleClose ])

  const renderDownloadButton = useMemo(() => {
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

  const renderDownloadModal = useMemo(() => {
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
    <div className="settings-wrapper px-4 pt-4">
      <div className="settings-body">
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input className="input" type="text" placeholder={title} value={title} onChange={handleTitleChange} />
          </div>
        </div>

        { ((isCollection === true) && collection) ?
          <div className="field">
            <label className="label">Color</label>

              <ColorPicker
                color={collection.color}
                onClick={handleColorChange}
              />
          </div>
          : null
        }

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

        { !(isCollection === true) && renderRelease }
      </div>

      <div className="settings-footer">
        <div className="columns">
          <div className="column is-three-quarters">
            <p className="fineprint-label ml-3" style={{position: "absolute", bottom: "0px"}}>
              <span data-tooltip={source?.date || collection?.date}>
                Last updated { toRelativeTime(source?.date) || toRelativeTime(collection?.date) }
              </span>
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
          { tableId && !uploadId ?
            <DataTable
              id={tableId}
              schema={schema}
              interactiveHeader={true}
              versionId={versionId}
              isSource={!(isCollection === true)}
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

