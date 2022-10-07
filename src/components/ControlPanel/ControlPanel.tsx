import React, { FC, useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import { useAppSelector } from 'hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import { selectUsableSources, selectMetadataMap, selectActiveDataSpace } from 'state/selectors'
import DataSource from './DataSource'
import TransformerCard from './TransformerCard'

import { useAuthContext } from 'contexts';
import { useKeyStoreContext } from 'contexts'

import helpIcon from 'assets/help-000.svg'

import './ControlPanel.sass'


const SourcesTab: FC = (props) => {
  const { user } = useAuthContext();
  const { keyStore, keyStoreIsReady } = useKeyStoreContext();

  const sources = useAppSelector(state => selectUsableSources(state, user))
  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const dSources = useMemo(() => {
    return sources.map(source => {
      const maybe_name = metadata[source.id]
      const name = maybe_name && keyStoreIsReady ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : source.id;

      const share = source.schema.shares.find(s => s.principal === user?.email)

      if (share) {
        return (
          <div className="panel-block-nb" key={source.id}>
            <DataSource source={source} title={name} color={share.type === "owner" ? "#00B7BE" : "#F39D01"} />
          </div>
        )
      }

      return null
    }).filter(x => !!x)
  }, [ sources, metadata, user, dataSpace, keyStore, keyStoreIsReady ])

  return (
    <>
      <div id="collection-intro">
        <div className="panel-block-nb">
          <p className="header-label">
            Data Space Sources
          </p>
        </div>

        { dSources }
      </div>

      <div className="panel-block" />

      <div className="panel-block-nb">
        <p className="header-label">
          Public Sources
        </p>
      </div>

      <div className="panel-block-nb is-size-7 pl-3"> No sources available </div>

    </>
  )
}

const WorkspaceTab: FC = (props) => {
  return (
    <>
      <div className="panel-block-nb">
        <div className="div is-11">
          <p className="header-label">
            Functions
          </p>
        </div>
        <div className="div is-1">
          <img src={helpIcon} alt="" />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          General
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="Merge" type="merge" />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Aggregate" type="aggregate" />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Filter" type="filter" />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Custom" type="custom" />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Function" type="function" isDisabled={true} />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Spatial
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="Geocode" type="geocode" isDisabled={true} />
        </div>
      </div>

      <div className="panel-block" />

      <div className="panel-block-nb">
        <div className="div is-11">
          <p className="header-label">
            Export
          </p>
        </div>
        <div className="div is-1">
          <img src={helpIcon} alt="" />
        </div>

      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Widgets
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="Graph" type="graph" isDisabled={true} />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Datasets
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="API" type="api" isDisabled={true} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="CSV" type="csv" isDisabled={true} />
        </div>
      </div>

    </>
  )
}

const ControlPanel: FC = (props) => {
  const [ activeTab, setActiveTab ] = useState("sources")

  return (
    <>
      <nav className="panel" style={{height: "100%"}}>
        <p className="panel-tabs">
          <Link id="workspace-intro" to="#workspace" className={"panel-tab-header" + (activeTab === "workspace" ? " is-active" : "")} onClick={() => setActiveTab("workspace")}>Workspace</Link>
          <Link to="#sources" className={"panel-tab-header" + (activeTab === "sources" ? " is-active" : "")} onClick={() => setActiveTab("sources")}>Sources</Link>
          <Link to="#comments" className={"panel-tab-header" + (activeTab === "comments" ? " is-active" : "")} onClick={() => setActiveTab("comments")}>Comments</Link>
        </p>
        <div className="panel-block">
          <p className="control has-icons-left">
            <input className="input" type="text" placeholder="Search" />
            <span className="icon is-left">
              <FontAwesomeIcon icon={faSearch} size="xs"/>
            </span>
          </p>
        </div>

        { activeTab === "sources" &&
          <SourcesTab />
        }

        { activeTab === "workspace" &&
          <WorkspaceTab />
        }

      </nav>
    </>
  )
}

export default ControlPanel
