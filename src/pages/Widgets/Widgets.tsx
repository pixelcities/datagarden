import React, { FC, Component, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import Widget from 'components/Widget'

import { useKeyStoreContext } from 'contexts'
import { useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectMetadataMap, selectPublishedWidgets } from 'state/selectors'


class WidgetsRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />

        <Sidebar page="widgets" isMini={false}>
          <Route path={this.parentPath} component={Widgets} />
        </Sidebar>
      </div>
    )
  }
}

const Widgets: FC = (props) => {
  const { keyStore, keyStoreIsReady } = useKeyStoreContext()

  const widgets = useAppSelector(selectPublishedWidgets)
  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [activeWidgetId, setActiveWidgetId] = useState("")

  const renderWidgets = useMemo(() => {
    return widgets.map(widget => {
      const maybe_name = metadata[widget.id]
      const name = maybe_name && keyStoreIsReady ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : widget.id;

      return (
        <div id={widget.id} className="message-box" onClick={() => setActiveWidgetId(widget.id)}>
          <div className="message-header label-size-2">
            <p>{name}</p>
          </div>
        </div>
      )
    })
  }, [ widgets, metadata, keyStore, keyStoreIsReady, dataSpace?.key_id ])

  const renderModal = useMemo(() => {
    const widget = widgets.find(w => w.id === activeWidgetId)

    if (widget) {
      return (
        <Widget
          id={widget.id}
          collection={widget.collection}
          onClose={() => setActiveWidgetId("")}
        />
      )
    }
  }, [ activeWidgetId, widgets ])

  return (
    <div className="page px-0 pt-0">

      { renderModal }

      <div className="title">
        Widgets

        <div className="border" />
      </div>

      <div className="main px-4">

        { renderWidgets }

      </div>
    </div>
  )
}

export default WidgetsRoute;
