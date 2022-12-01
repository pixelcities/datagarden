import React, { FC, Component, useCallback, useEffect, useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { Switch, Route, Link, useParams } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faPlus, faAlignJustify, faChartBar } from '@fortawesome/free-solid-svg-icons'

import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectPages, selectPageById, selectContentIdsByPageId, selectMetadataMap, selectMetadataById, selectActiveDataSpace, selectUsers } from 'state/selectors'
import { createPage, createContent, createMetadata, shareSecret } from 'state/actions'

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import ReportCard from 'components/ReportCard'
import Content from 'components/Content'

import './Reports.sass'


class ReportsRoute extends Component<RouteComponentProps> {
  render() {
    const parentPath = this.props.match.path

    return (
      <div>
        <Navbar />

        <Sidebar page="reports" isMini={false}>
          <Switch>
            <Route path={parentPath + "/:id"} component={Report} />
            <Route path={parentPath} component={ReportOverview} />
          </Switch>
        </Sidebar>
      </div>
    )
  }
}


const Report: FC = (props) => {
  const dispatch = useAppDispatch()

  const { id } = useParams<{ id: string }>()
  const { keyStore } = useKeyStoreContext()

  const [addContentIsActive, setAddContentIsActive] = useState(false)
  const [title, setTitle] = useState(id)

  const titleMetadata = useAppSelector(state => selectMetadataById(state, id))
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const contentIds = useAppSelector(state => selectContentIdsByPageId(state, id))
  const page = useAppSelector(state => selectPageById(state, id))

  useEffect(() => {
    if (titleMetadata) {
      setTitle(keyStore?.decrypt_metadata(dataSpace?.key_id, titleMetadata.metadata))
    }
  }, [ dataSpace, titleMetadata, keyStore ])

  const handleAddStaticContent = useCallback(() => {
    if (page) {
      let initialContent = ""

      if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
        initialContent = keyStore?.encrypt_metadata(page.key_id, "")
      }

      dispatch(createContent({
        id: crypto.randomUUID(),
        page_id: id,
        workspace: "default",
        type: "static",
        access: page.access,
        content: initialContent,
        draft: undefined
      }))
    }

    setAddContentIsActive(false)
  }, [ id, page, keyStore, dispatch ])

  const renderContent = useMemo(() => {
    return contentIds.map((contentId) => {
      return (
        <div key={contentId} className="content-block">
          <Content id={contentId} />
        </div>
      )
    })
  }, [ contentIds ])

  const renderAddContent = useMemo(() => {
    return (
      <div className={"modal " + (addContentIsActive ? "is-active" : "")}>
        <div className="modal-background"/>
        <div className="modal-content">
          <div className="box">
            <p className="buttons">
              <button className="button is-large" onClick={handleAddStaticContent}>
                <span className="icon is-medium">
                  <FontAwesomeIcon icon={faAlignJustify} color="#4f4f4f" size="lg"/>
                </span>
              </button>

              <button className="button is-large" disabled onClick={() => {}}>
                <span className="icon is-medium">
                  <FontAwesomeIcon icon={faChartBar} color="#4f4f4f" size="lg"/>
                </span>
              </button>
            </p>
          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={() => setAddContentIsActive(false)}></button>
      </div>
    )

  }, [ addContentIsActive, handleAddStaticContent ])

  return (
    <div className="page px-0 pt-0">

      { renderAddContent }

      <div className="title">
        { title }

        <div className="border" />
      </div>

      <div className="main px-4">
        { renderContent }

        <div className="content-block">
          <div className="columns is-centered pt-3">
            <div className="column is-narrow">
              <button className="hover-button is-large" onClick={() => setAddContentIsActive(true)}>
                <span className="icon is-large">
                  <FontAwesomeIcon icon={faPlus} size="lg"/>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


const ReportOverview: FC = (props) => {
  const [createReportIsActive, setCreateReportIsActive] = useState(false)
  const { keyStore, keyStoreIsReady } = useKeyStoreContext();

  const pages = useAppSelector(selectPages)
  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const createReportHandler = () => {
    setCreateReportIsActive(true)
  }

  const renderReports = useMemo(() => {
    return pages.map((page) => {
      const maybe_name = metadata[page.id]
      const name = maybe_name && keyStoreIsReady ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : page.id

      return (
        <div key={page.id} className="column is-narrow">
          <Link to={"/ds1/reports/" + page.id}>
            <ReportCard
              id={page.id}
              title={name}
              type="preview"
            />
          </Link>
        </div>
      )
    })
  }, [ metadata, pages, dataSpace, keyStore, keyStoreIsReady ])


  return (
    <div className="page px-0 pt-0">

      <CreateReport
        isActive={createReportIsActive}
        onClose={() => setCreateReportIsActive(false)}
      />

      <div className="title">
        Reports

        <div className="border" />
      </div>

      <div className="main px-4">
        <div className="columns is-multiline">

          <div className="column is-narrow">
            <ReportCard
              id="create-report"
              title="Create report"
              type="add"
              onClick={createReportHandler}
            />
          </div>

          { renderReports }

        </div>
      </div>
    </div>
  )
}


interface CreateReportProps {
  isActive: boolean,
  onClose: () => void
}

const CreateReport: FC<CreateReportProps> = ({ isActive, onClose }) => {
  const dispatch = useAppDispatch()
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const users = useAppSelector(selectUsers)

  const { user } = useAuthContext()
  const { keyStore, protocol } = useKeyStoreContext()

  const [access, setAccess] = useState([{"type": "internal"}])
  const [title, setTitle] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const id = crypto.randomUUID()

    if (access.filter(x => x.type === "internal").length > 0) {
      const key_id: string = await keyStore?.generate_key(32)

      if (user) {
        for (const receiver of users) {
          if (receiver.id === user.id) {
            continue
          }

          // TODO: handle sharing with new users
          const secret: string = await protocol?.encrypt(receiver.id, keyStore?.get_key(key_id))

          dispatch(shareSecret({
            key_id: key_id,
            owner: user.id,
            receiver: receiver.id,
            ciphertext: secret
          }))
        }

        dispatch(createPage({
          id: id,
          workspace: "default",
          access: access,
          key_id: key_id
        }))
      }

    } else if (access.filter(x => x.type === "public").length > 0) {
      dispatch(createPage({
        id: id,
        workspace: "default",
        access: access
      }))

    } else {
      console.error("Attempted to create report with neither internal nor public shares")
    }

    dispatch(createMetadata({
      id: id,
      workspace: "default",
      metadata: keyStore?.encrypt_metadata(dataSpace?.key_id, title)
    }))

    setTitle("")
    onClose()
  }

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">

            <form onSubmit={handleSubmit}>

            <div className="field pb-0 pt-5">
              <label id="publish" className="label pb-2"> Title </label>

              <div className="control is-fullwidth">
                <input className="input py-0" type="text" placeholder={title} value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}/>
              </div>
            </div>

            <div className="field pb-0 pt-5">
              <label id="publish" className="label pb-2"> Access </label>

              <div className="control has-icons-left pb-4" style={{width: "15rem"}}>
                <div className="select is-fullwidth">
                  <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAccess([{"type": e.target.value}])} value={(access.length > 0) ? access[0].type : ""}>
                    <option value="internal">Internal</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div className="icon is-small is-left pb-2">
                  <FontAwesomeIcon icon={faKey} size="sm"/>
                </div>
              </div>
            </div>

              <div className="field is-grouped is-grouped-right pt-0">
                <div className="control">
                  <input type="submit" className="button is-primary" value="Create Report" />
                </div>
              </div>
            </form>

          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
      </div>
    </>
  )
}


export default ReportsRoute;
