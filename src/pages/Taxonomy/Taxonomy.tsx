import React, { FC, Component, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faBook, faProjectDiagram } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import NotificationsBar from 'components/NotificationsBar'
import Dropdown from 'components/Dropdown'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectActiveDataSpace, selectConcepts } from 'state/selectors'
import { createConcept, updateConcept } from 'state/actions'
import { ConceptA } from 'types'

import { emptyTaxonomy, loadTaxonomy, Taxonomy } from 'utils/taxonomy'


class TaxonomyRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />
        <NotificationsBar />

        <Sidebar page="taxonomy" isMini={false}>
          <Route path={this.parentPath} component={TaxonomyPage} />
        </Sidebar>
      </div>
    )
  }
}

interface ConceptDetailI {
  concept?: ConceptA,
  taxonomy?: Taxonomy
}

const ConceptDetail: FC<ConceptDetailI> = ({ concept, taxonomy }) => {
  const dispatch = useAppDispatch()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [name, setName] = useState(concept?.name ?? "")
  const [description, setDescription] = useState(concept?.description ?? "")
  const [dataType, setDataType] = useState(concept?.dataType)
  const [aggregateFn, setAggregateFn] = useState(concept?.aggregateFn)
  const [broader, setBroader] = useState(concept?.broader || [])

  const handleSubmit = (e: any) => {
    e.preventDefault()

    const id = concept ? concept.id : crypto.randomUUID()

    const action = emptyTaxonomy(dataSpace?.key_id).serialize({
      id: id,
      workspace: concept?.workspace || "default",
      name: name,
      dataType: dataType,
      aggregateFn: aggregateFn,
      description: description,
      broader: broader
    })

    if (action) {
      if (concept) {
        dispatch(updateConcept(action))
      } else {
        dispatch(createConcept(action))
      }
    }

    setName("")
    setDescription("")
    setDataType(undefined)
    setAggregateFn(undefined)
    setBroader([])
  }

  const allConcepts = useMemo(() => taxonomy?.list().map(c => [c.id, c.name] as [string, string]) || [], [ taxonomy ])
  const broaderNames = useMemo(() => broader.map(id => [id, taxonomy?.get(id)?.name] as [string, string]), [ broader, taxonomy ])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="tile is-ancestor">
          <div className="tile is-vertical is-12">
            <div className="tile">
              <div className="tile is-parent">
                <div className="tile is-child tile-is-white">

                  <div className="field">
                    <label className="label">Name</label>
                    <div className="control">
                      <input className="input" type="text" style={{borderColor: "#f5f5f5"}} value={name} onChange={(e: any) => setName(e.target.value)} />
                    </div>
                  </div>

                </div>
              </div>

              <div className="tile is-parent is-vertical">
                <div className="tile is-child notification tile-is-white">

                  <div className="field pb-0">
                    <label className="label">Aggregate Function</label>
                    <Dropdown
                      items={["array_agg", "avg", "sum"]}
                      selected={aggregateFn}
                      onClick={(item: string) => setAggregateFn(item)}
                    />
                  </div>
                </div>

                <div className="tile is-child notification tile-is-white">
                  <div className="field pb-0">
                    <label className="label">Data Type</label>
                    <p className="fineprint-label label-size-3 is-left pt-1">
                      { dataType }
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="tile is-parent">
              <div className="tile is-child notification tile-is-white">

                <div className="field">
                  <label className="label">Description</label>
                  <div className="control">
                    <textarea className="input" style={{borderColor: "#f5f5f5"}} value={description} onChange={(e: any) => setDescription(e.target.value)} />
                  </div>
                </div>

              </div>
            </div>

            <div className="tile">
              <div className="tile is-parent">
                <div className="tile is-child notification tile-is-white">

                  <div className="field pb-0">
                    <label className="label">Broader</label>
                    <Dropdown
                      items={allConcepts}
                      selected={broaderNames.length > 0 ? broaderNames[0] : null}
                      onClick={x => setBroader([...broader, x[0]])}
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <input type="submit" className="button is-primary" value={concept ? "Update concept" : "Create concept"} />
          </div>
        </div>

      </form>
    </div>
  )
}

const TaxonomyPage: FC = (props) => {
  const concepts = useAppSelector(selectConcepts)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [activeConcept, setActiveConcept] = useState<ConceptA | undefined>()

  const taxonomy = useMemo(() => {
    if (dataSpace) {
      return loadTaxonomy(dataSpace.key_id, concepts)
    }
  }, [ dataSpace, concepts ])

  const renderRoot = useMemo(() => {
    return taxonomy?.root().map(r => {
      const children = r.narrower?.map(id => {
        const child = taxonomy?.get(id)

        return (
          <li key={child.id}>
            <div className={"panel-block-nb is-clickable" + (activeConcept?.id === child.id ? " is-active" : "")} onClick={() => setActiveConcept(child)}>
              <span className="panel-icon">
                <div className="icon is-small is-left pb-2">
                  <FontAwesomeIcon icon={faBook} size="sm"/>
                </div>
              </span>
              { child.name }
            </div>
          </li>
        )
      })

      return (
        <li key={r.id}>
          <div className={"panel-block-nb is-clickable" + (activeConcept?.id === r.id ? " is-active" : "")} onClick={() => setActiveConcept(r)}>
            <span className="panel-icon">
              <div className="icon is-small is-left pb-2">
                <FontAwesomeIcon icon={faProjectDiagram} size="sm"/>
              </div>
            </span>
            { r.name }
          </div>

          { children &&
            <ul className="pl-3">
              { children }
            </ul>
          }

          <div className="seperator" />
        </li>
      )
    })
  }, [ activeConcept, taxonomy ])

  return (
    <div className="page px-0 pt-0">
      <div className="title">
        Taxonomy

        <button className="button is-success is-outlined is-pulled-right" onClick={() => setActiveConcept(undefined)}> Add concept </button>

        <div className="border" />
      </div>

      <div className="main px-4">
        <div className="columns">
          <div className="column is-one-quarter">

            <article className="panel is-primary">
              <p className="panel-heading">
                { activeConcept ? activeConcept.name : "New" }
              </p>

              <p className="panel-tabs">
                <Link to="#all" className="is-active">All</Link>
                <Link to="#schemas" >Schemas</Link>
                <Link to="#orgs" >Organisations</Link>
              </p>

              <div className="panel-block">
                <p className="control has-icons-left">
                  <input className="input" type="text" placeholder="Search" onChange={() => {}} />
                  <span className="icon is-left">
                    <FontAwesomeIcon icon={faSearch} size="xs"/>
                  </span>
                </p>
              </div>

              <ul>
                { renderRoot }
              </ul>

            </article>
          </div>

          <div className="column is-three-quarters">
            <div className="box" style={{backgroundColor: "#f5f5f5"}}>
              <ConceptDetail key={activeConcept?.id || "new"} concept={activeConcept} taxonomy={taxonomy} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TaxonomyRoute;
