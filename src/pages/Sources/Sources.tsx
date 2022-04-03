import React, { FC, Component, useState, useMemo } from 'react';
import { RouteComponentProps } from 'react-router';
import { Route } from "react-router-dom";

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import SourceTable from 'components/SourceTable'
import SourceCard from 'components/SourceCard'
import SourceCreator from 'components/SourceCreator'

import { useAppSelector } from 'hooks'
import { selectVisibleSources, selectMetadataMap } from 'state/selectors'
import { Source } from 'types'

import { useAuthContext } from 'utils/AuthContext';
import { useKeyStoreContext } from 'utils/KeyStoreContext'

import listView from 'assets/page-setting-list.svg'
import iconView from 'assets/page-setting-icon.svg'

import './Sources.sass'

class SourcesRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path;

  render() {
    return (
      <div>
        <Navbar />

        <Sidebar page="sources" isMini={false}>
          <Route path={this.parentPath} component={Sources} />
        </Sidebar>
      </div>
    )
  }
}

const Sources: FC = (props) => {
  const [addSourceModalIsActive, setAddSourceModalIsActive] = useState(false)
  const [viewSource, setViewSource] = useState<Source | null>(null)
  const { keyStore, keyStoreIsReady } = useKeyStoreContext();
  const { user } = useAuthContext();

  const sources = useAppSelector(state => selectVisibleSources(state, user))
  const metadata = useAppSelector(selectMetadataMap)

  const addSourceHandler = () => {
    setAddSourceModalIsActive(!addSourceModalIsActive)
  }

  const renderSources = useMemo(() => {
    return sources.map((source) => {
      const maybe_name = metadata[source.id]
      const name = maybe_name && keyStoreIsReady ? keyStore?.decrypt_metadata(maybe_name) : source.id

      return (
        <div key={source.id} className="column is-narrow">
          <SourceCard
            title={name}
            type="csv"
            sourceId={source.id}
            onClick={() => setViewSource(source)}
          />
        </div>
      )
    })
  }, [ metadata, sources, keyStore, keyStoreIsReady ])

  return (
    <div className="page px-0 pt-0">

      { viewSource &&
         <SourceTable
           id={viewSource.id}
           uri={viewSource.uri}
           schema={viewSource.schema}
           onClose={() => setViewSource(null)}
         />
      }

      <SourceCreator
        isActive={addSourceModalIsActive}
        onClose={addSourceHandler}
        onComplete={setViewSource}
      />

      <div className="title">

        Sources

        <div className="border" />
      </div>

      <div className="layout-settings is-pulled-right">
        <div className="columns">
          <div className="column">
            <img src={iconView} style={{cursor: "pointer"}} alt="" />
          </div>

          <div className="column">
            <img src={listView} style={{cursor: "pointer"}} alt="" />
          </div>
        </div>
      </div>

      <div className="main">
        <div className="columns is-multiline">

          <div className="column is-narrow">
            <SourceCard
              title="Add source"
              type="add"
              onClick={addSourceHandler}
            />
          </div>

          { renderSources }

        </div>
      </div>
    </div>
  )
}

export default SourcesRoute;
