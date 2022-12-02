import React, { FC, Component, useCallback, useEffect, useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { Switch, Route, Link, useParams } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faPlus, faAlignJustify, faChartBar } from '@fortawesome/free-solid-svg-icons'

import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { useAppSelector, useAppDispatch } from 'hooks'
import { selectPages, selectPageById, selectContentIdsByPageId, selectMetadataMap, selectMetadataById, selectActiveDataSpace, selectUsers, selectPublishedWidgets } from 'state/selectors'
import { createPage, createContent, createMetadata, shareSecret } from 'state/actions'

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import ReportCard from 'components/ReportCard'
import Content from 'components/Content'
import Dropdown from 'components/Dropdown'

import './Reports.sass'


class ReportsRoute extends Component<RouteComponentProps> {
  render() {
    const parentPath = this.props.match.path

    // Anything on /pages may be visited without login. All it does is embed an
    // iframe, making sure it still appears as if it is our main origin. Naturally,
    // this requires access to be set to public.
    if (parentPath === "/pages/:handle/:id") {
      return (
        <Route path="/pages/:handle/:id" component={Public} />
      )
    }

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

const Public: FC = (props) => {
  const { handle, id } = useParams<{ handle: string, id: string }>()

  const [height, setHeight] = useState(0)

  useEffect(() => {
    fetch(`${process.env.REACT_APP_CONTENT_HOST}/info/${handle}/${id}`, {
      method: "GET",
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(response)
      } else {
        return response.json()
      }
    }).then((data) => {
      setHeight(data.height)
    }).catch((e) => {
      console.log(e);
    });
  }, [ handle, id ])

  return (
    <main className="container pt-6">
      { height > 0 &&
        <iframe title={id} src={process.env.REACT_APP_CONTENT_HOST + "/pages/" + handle + "/" + id} sandbox="allow-scripts allow-same-origin" width="100%" height={height} scrolling="no" frameBorder="0" />
      }
    </main>
  )
}

const Report: FC = (props) => {
  const dispatch = useAppDispatch()

  const { id } = useParams<{ id: string }>()
  const { keyStore } = useKeyStoreContext()

  const [addContentIsActive, setAddContentIsActive] = useState(false)
  const [addWidgetIsActive, setAddWidgetIsActive] = useState(false)
  const [title, setTitle] = useState(id)
  const [selectedWidget, setSelectedWidget] = useState<string | undefined>()

  const titleMetadata = useAppSelector(state => selectMetadataById(state, id))
  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const contentIds = useAppSelector(state => selectContentIdsByPageId(state, id))
  const page = useAppSelector(state => selectPageById(state, id))
  const widgets = useAppSelector(selectPublishedWidgets)

  useEffect(() => {
    if (titleMetadata) {
      setTitle(keyStore?.decrypt_metadata(dataSpace?.key_id, titleMetadata.metadata))
    }
  }, [ dataSpace, titleMetadata, keyStore ])

  const widgetTitleMap = useMemo(() => {
    let titleMap: {[key: string]: string} = {}

    widgets.forEach(widget => {
      const maybe_name = metadata[widget.id]
      const name = maybe_name ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : widget.id;

      titleMap[name] = widget.id
    })

    return titleMap
  }, [ widgets, keyStore, metadata, dataSpace?.key_id ])

  const handleAddStaticContent = useCallback(() => {
    if (page) {
      let initialContent = btoa("<p></p>")

      if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
        initialContent = keyStore?.encrypt_metadata(page.key_id, "<p></p>")
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

  const handleAddWidgetContent = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (page) {
      const widgetTitle = selectedWidget ? selectedWidget : Object.keys(widgetTitleMap)[0]
      const widgetId = widgetTitleMap[widgetTitle]
      const widget = widgets.find(widget => widget.id === widgetTitleMap[widgetTitle])

      // Adding a widget consists of passing forward the widget content to the content block.
      //
      // This is done so that the widget itself can take care of rendering the correct output.
      // In case of internal content, the widget is unencrypted and immediatly re-encrypted with
      // the page key. The page key is also shared internally but is only used for displaying
      // the report. Because this key needs to be passed around a bit for proper rendering, it is
      // unwise to use the actualy dataspace key for this.
      if (widget && widget.access) {
        let widgetContent = ""

        // Grab the widget content, which may be encrypted with the internal dataspace key
        if (widget.access.filter(x => x.type === "internal").length > 0) {
          widgetContent =  keyStore?.decrypt_metadata(dataSpace?.key_id, widget.content)

        } else if (widget.access.filter(x => x.type === "public").length > 0) {
          widgetContent = widget.content || ""
        }

        let content = widgetContent

        if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
          content = keyStore?.encrypt_metadata(page.key_id, widgetContent)
        }

        dispatch(createContent({
          id: crypto.randomUUID(),
          page_id: id,
          workspace: "default",
          type: "widget",
          widget_id: widgetId,
          access: page.access,
          content: content,
          height: widget.height,
          draft: undefined
        }))
      }
    }

    setAddContentIsActive(false)
    setAddWidgetIsActive(false)
  }, [ id, page, widgets, selectedWidget, widgetTitleMap, keyStore, dataSpace?.key_id, dispatch ])

  const renderContent = useMemo(() => {
    return contentIds.map((contentId) => {
      return (
        <div key={contentId} className="content-block">
          <Content id={contentId} keyId={page?.key_id} />
        </div>
      )
    })
  }, [ contentIds, page?.key_id ])

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

              <button className="button is-large" onClick={() => setAddWidgetIsActive(true)}>
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

  const renderAddWidget = useMemo(() => {
    const widgetTitles = Object.keys(widgetTitleMap)

    return (
      <div className={"modal " + (addWidgetIsActive ? "is-active" : "")}>
        <div className="modal-background"/>
        <div className="modal-content">
          <div className="box">
            <form onSubmit={handleAddWidgetContent}>
              <div className="field pb-0 pt-5">
                <label id="publish" className="label pb-2"> Select widget </label>

                <Dropdown
                  items={widgetTitles}
                  selected={selectedWidget ? selectedWidget : widgetTitles[0]}
                  onClick={(item: string) => setSelectedWidget(item)}
                />
              </div>

              <div className="field is-grouped is-grouped-right pt-0">
                <div className="control">
                  <input type="submit" className="button is-primary" value="Add widget" />
                </div>
              </div>
            </form>

          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={() => setAddWidgetIsActive(false)}></button>
      </div>
    )
  }, [ addWidgetIsActive, handleAddWidgetContent, selectedWidget,widgetTitleMap ])

  return (
    <div className="page px-0 pt-0">

      { renderAddContent }
      { renderAddWidget }

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
