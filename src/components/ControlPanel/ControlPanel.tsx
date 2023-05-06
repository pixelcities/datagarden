import React, { FC, useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import { useAppSelector } from 'hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import { selectUsableSources, selectMetadataMap, selectActiveDataSpace } from 'state/selectors'
import DataSource from './DataSource'
import TransformerCard from './TransformerCard'
import WidgetCard from './WidgetCard'

import { useAuthContext } from 'contexts';
import { useKeyStoreContext } from 'contexts'

import helpIcon from 'assets/help-000.svg'

import './ControlPanel.sass'


interface SourcesTabProps {
  search: string
}

const SourcesTab: FC<SourcesTabProps> = ({ search }) => {
  const { user } = useAuthContext();
  const { keyStore, keyStoreIsReady } = useKeyStoreContext();

  const sources = useAppSelector(state => selectUsableSources(state, user))
  const metadata = useAppSelector(selectMetadataMap)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const dSources = useMemo(() => {
    return sources.map(source => {
      const maybe_name = metadata[source.id]
      const name = maybe_name && keyStoreIsReady ? keyStore?.decrypt_metadata(dataSpace?.key_id, maybe_name) : source.id;

      const share = source.schema.shares.find(s => s.principal === user?.id)

      if (share) {
        if (search === "" || name.indexOf(search) !== -1) {
          return (
            <div className="panel-block-nb" key={source.id}>
              <DataSource source={source} title={name} color={share.type === "owner" ? "#00B7BE" : "#F39D01"} />
            </div>
          )
        }
      }

      return null
    }).filter(x => !!x)
  }, [ sources, search, metadata, user, dataSpace, keyStore, keyStoreIsReady ])

  return (
    <>
      <div id="collection-intro" style={{position: "relative", maxHeight: "50%"}}>
        <div className="panel-block-nb">
          <p className="header-label">
            Data Space Sources
          </p>
        </div>

        <div style={{maxHeight: "calc(100% - 2rem)", overflowY: "scroll"}}>
          { dSources }
        </div>
      </div>

      <div className="panel-block" />

      <div className="panel-block-nb">
        <p className="header-label">
          Workspace Sources
        </p>
      </div>

      <div className="panel-block-nb is-size-7 pl-3"> No sources available </div>

    </>
  )
}

const WorkspaceTab: FC = (props) => {
  const [helpIsActive, setHelpIsActive] = useState(false)

  return (
    <>
      <div className="panel-block-nb">
        <div className="div is-11">
          <p className="header-label">
            Functions
          </p>
        </div>
        <div className="div is-1">
          <img className="help-icon" src={helpIcon} alt="" style={helpIsActive ? {backgroundColor: "#f9cd307e"} : {}} onClick={() => setHelpIsActive(!helpIsActive)} />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          General
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="Merge" type="merge" tooltip={helpIsActive ? "Merge two collections when both share a column" : undefined} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Aggregate" type="aggregate" tooltip={helpIsActive ? "Aggregate data" : undefined} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Filter" type="filter" tooltip={helpIsActive ? "Filter data to only keep target rows" : undefined} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Function" type="function" tooltip={helpIsActive ? "Apply a function or do basic arithmetics on your data" : undefined} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Attribute" type="attribute" tooltip={helpIsActive ? "Add or drop columns, or change data types" : undefined} />
        </div>
        <div className="column is-4 mt-4">
          <TransformerCard title="Custom" type="custom" tooltip={helpIsActive ? "Advanced SQL query editor" : undefined} />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Privacy
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <TransformerCard title="Privatise" type="privatise" tooltip={helpIsActive ? "Create a synthetic copy of your original data" : undefined} />
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

      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Widgets
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <WidgetCard title="Chart" type="chart" tooltip={helpIsActive ? "Create and publish charts, to gain insights about your data" : undefined} />
        </div>

        <div className="column is-4 mt-4">
          <WidgetCard title="Map" type="map" tooltip={helpIsActive ? "Create and publish maps, to gain insights about your data" : undefined} />
        </div>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Datasets
        </p>
      </div>
      <div className="columns ml-3 is-gapless is-multiline">
        <div className="column is-4 mt-4">
          <WidgetCard title="API" type="api" isDisabled={true} />
        </div>
      </div>

    </>
  )
}

const ControlPanel: FC = (props) => {
  // Default the active panel to sources if the onboarding is not yet completed, the workspace tab otherwise
  const [ activeTab, setActiveTab ] = useState(parseInt(localStorage.getItem("onboarding-builder") || "0") !== -1 ? "sources" : "workspace")
  const [ search, setSearch ] = useState("")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveTab("sources")
    setSearch(e.target.value)
  }

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
            <input className="input" type="text" placeholder="Search" onChange={handleSearch} />
            <span className="icon is-left">
              <FontAwesomeIcon icon={faSearch} size="xs"/>
            </span>
          </p>
        </div>

        { activeTab === "sources" &&
          <SourcesTab search={search} />
        }

        { activeTab === "workspace" &&
          <WorkspaceTab />
        }

      </nav>
    </>
  )
}

export default ControlPanel
