import React, { FC, Component, useMemo, useState, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, useParams, useHistory } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faBook, faProjectDiagram } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import NotificationsBar from 'components/NotificationsBar'
import ConceptDetail from 'components/ConceptDetail'

import { useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectConcepts } from 'state/selectors'
import { ConceptA } from 'types'

import { loadTaxonomy } from 'utils/taxonomy'


class TaxonomyRoute extends Component<RouteComponentProps> {
  render() {
    const parentPath = this.props.match.path

    return (
      <div>
        <Navbar />
        <NotificationsBar />

        <Sidebar page="taxonomy" isMini={false}>
          <Route path={parentPath + "/:id?"} component={TaxonomyPage} />
        </Sidebar>
      </div>
    )
  }
}

const TaxonomyPage: FC = (props) => {
  const { id } = useParams<{ id: string }>()

  const history = useHistory()
  const concepts = useAppSelector(selectConcepts)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [search, setSearch] = useState("")
  const [activeConcept, setActiveConcept] = useState<ConceptA | undefined>()

  const taxonomy = useMemo(() => {
    if (dataSpace) {
      return loadTaxonomy(dataSpace.key_id, concepts)
    }
  }, [ dataSpace, concepts ])

  useEffect(() => {
    if (taxonomy && id) {
      if (id === "new") {
        setActiveConcept(undefined)
      } else {
        setActiveConcept(taxonomy.get(id))
      }
    }
  }, [ id, taxonomy ])

  const renderRoot = useMemo(() => {
    return taxonomy?.root().map(r => {
      const getChildren = (concept: ConceptA) => {
        return concept.narrower?.map(id => {
          const child = taxonomy?.get(id)
          const children = getChildren(child)

          return (
            <li key={child.id}>
              <div className={"panel-block-nb is-clickable" + (activeConcept?.id === child.id ? " is-active" : "")} onClick={() => history.push(`/ds/${dataSpace?.handle}/taxonomy/${child.id}`)}>
                <span className="panel-icon">
                  <div className="icon is-small is-left pb-2">
                    <FontAwesomeIcon icon={children.length > 0 ? faProjectDiagram : faBook} size="sm"/>
                  </div>
                </span>
                { child.name }
              </div>

              { children &&
                <ul className="pl-3">
                  { children }
                </ul>
              }
            </li>
          )
        }) ?? []
      }

      const children = getChildren(r)

      return (
        <li key={r.id}>
          <div className={"panel-block-nb is-clickable" + (activeConcept?.id === r.id ? " is-active" : "")} onClick={() => history.push(`/ds/${dataSpace?.handle}/taxonomy/${r.id}`)}>
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
  }, [ activeConcept, taxonomy, dataSpace?.handle, history ])

  const renderRest = useMemo(() => {
    return taxonomy?.isolated().map(x => {
      return (
        <li key={x.id}>
          <div className={"panel-block-nb is-clickable" + (activeConcept?.id === x.id ? " is-active" : "")} onClick={() => history.push(`/ds/${dataSpace?.handle}/taxonomy/${x.id}`)}>
            <span className="panel-icon">
              <div className="icon is-small is-left pb-2">
                <FontAwesomeIcon icon={faBook} size="sm"/>
              </div>
            </span>
            { x.name }
          </div>

        </li>
      )
    })
  }, [ activeConcept, taxonomy, dataSpace?.handle, history ])

  const renderSearch = useMemo(() => {
    if (search !== "") {
      return taxonomy?.list().filter(x => x.name.toLowerCase().indexOf(search) !== -1).map(x => {
        return (
          <li key={x.id}>
            <div className={"panel-block-nb is-clickable" + (activeConcept?.id === x.id ? " is-active" : "")} onClick={() => history.push(`/ds/${dataSpace?.handle}/taxonomy/${x.id}`)}>
              <span className="panel-icon">
                <div className="icon is-small is-left pb-2">
                  <FontAwesomeIcon icon={faBook} size="sm"/>
                </div>
              </span>
              { x.name }
            </div>

          </li>
        )
      })
    }
  }, [ activeConcept, taxonomy, dataSpace?.handle, history, search ])

  const handleUpsert = (id: string) => {
    history.push(`/ds/${dataSpace?.handle}/taxonomy/${id}`)
  }

  return (
    <div className="page px-0 pt-0">
      <div className="title">
        Taxonomy

        <div className="buttons is-pulled-right">
          <button className="button is-success is-outlined" onClick={() => {}} disabled> Visualize </button>
          <button className="button is-success is-outlined" onClick={() => history.push(`/ds/${dataSpace?.handle}/taxonomy/new`)}> Add concept </button>
        </div>

        <div className="border" />
      </div>

      <div className="main px-4">
        <div className="columns">
          <div className="column is-one-quarter">

            <article className={"panel " + (activeConcept ? "is-primary" : "is-success")}>
              <p className="panel-heading">
                { activeConcept ? activeConcept.name : "New" }
              </p>

              <div className="panel-block">
                <p className="control has-icons-left">
                  <input className="input" type="text" placeholder="Search" onChange={e => setSearch(e.target.value)} />
                  <span className="icon is-left">
                    <FontAwesomeIcon icon={faSearch} size="xs"/>
                  </span>
                </p>
              </div>

              <ul style={{maxHeight: "calc(100vh - 7rem - 2px)", overflowY: "scroll", marginBottom: "2rem"}}>
                { search !== "" ?
                  <>
                    { renderSearch }
                  </>
                :
                  <>
                    { renderRoot }
                    { renderRest }
                  </>
                }
              </ul>

            </article>
          </div>

          <div className="column is-three-quarters">
            <div className="box" style={{backgroundColor: "#f5f5f5"}}>
              <ConceptDetail key={activeConcept?.id || "new"} concept={activeConcept} taxonomy={taxonomy} onComplete={handleUpsert} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TaxonomyRoute;
