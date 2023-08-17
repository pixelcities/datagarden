import React, { FC, Component, useMemo, useState, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, useParams, useHistory } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faSearch, faBook, faProjectDiagram } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import NotificationsBar from 'components/NotificationsBar'
import Dropdown from 'components/Dropdown'
import Constraint from 'components/Constraint'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectActiveDataSpace, selectConcepts } from 'state/selectors'
import { createConcept, updateConcept, deleteConcept } from 'state/actions'
import { ConceptA, Rule, DataType } from 'types'

import { emptyTaxonomy, loadTaxonomy, Taxonomy } from 'utils/taxonomy'


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

interface ConceptDetailI {
  concept?: ConceptA,
  taxonomy?: Taxonomy
}

const ConceptDetail: FC<ConceptDetailI> = ({ concept, taxonomy }) => {
  const dispatch = useAppDispatch()
  const history = useHistory()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [name, setName] = useState(concept?.name ?? "")
  const [description, setDescription] = useState(concept?.description ?? "")
  const [dataType, setDataType] = useState(concept?.dataType)
  const [aggregateFn, setAggregateFn] = useState(concept?.aggregateFn)
  const [broader, setBroader] = useState(concept?.broader || [])
  const [constraints, setConstraints] = useState<(Rule | undefined)[]>(concept?.constraints || [])

  const [error, setError] = useState("")

  const handleDelete = () => {
    if (concept && window.confirm("Are you sure you want to delete this concept?")) {
      dispatch(deleteConcept({
        id: concept.id
      }))

      history.push(`/ds/${dataSpace?.handle}/taxonomy/new`)
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    if (name === "") {
      setError("Name cannot be empty")
      return
    }

    if (!concept && !dataType) {
      setError("Data type is required")
      return
    }

    const id = concept ? concept.id : crypto.randomUUID()
    const action = emptyTaxonomy(dataSpace?.key_id).serialize({
      id: id,
      workspace: concept?.workspace || "default",
      name: name,
      dataType: dataType,
      aggregateFn: aggregateFn,
      description: description,
      broader: broader,
      constraints: constraints.filter((x): x is Rule => !!x)
    })

    if (action) {
      if (concept) {
        dispatch(updateConcept(action))
      } else {
        dispatch(createConcept(action))

        setName("")
        setDescription("")
        setDataType(undefined)
        setAggregateFn(undefined)
        setBroader([])
        setConstraints([])
      }
    }

    history.push(`/ds/${dataSpace?.handle}/taxonomy/${id}`)
  }

  const allConcepts = useMemo(() => taxonomy?.list().map(c => [c.id, c.name] as [string, string]) || [], [ taxonomy ])
  const broaderNames = useMemo(() => broader.map(id => [id, taxonomy?.get(id)?.name] as [string, string]), [ broader, taxonomy ])

  const handleAddConstraint = (e: any) => {
    e.preventDefault()

    if (!dataType) {
      setError("You should set a data type first")
      return
    }

    setConstraints([...constraints, undefined])
  }

  const renderConstraints = useMemo(() => {
    return concept && dataType && constraints.map((constraint, i) => {
      const handleUpdate = (rule: Rule) => {
        const data = JSON.parse(JSON.stringify(constraints))
        data[i] = rule

        setConstraints(data)
      }

      const handleDelete = () => {
        setConstraints(constraints.filter((_, j) => i !== j))
      }

      return (
        <div key={i} className="py-2">
          <Constraint conceptName={concept.name} dataType={dataType} rule={constraint} onChange={handleUpdate} onDelete={handleDelete} />
        </div>
      )
    })

  }, [ concept, dataType, constraints ])

  return (
    <div>

      { error !== "" &&
        <article className="message is-danger">
          <div className="message-header">
            <p>{ error }</p>
            <button className="delete" aria-label="delete" onClick={() => setError("")} />
          </div>
        </article>
      }

      <form onSubmit={handleSubmit}>
        <div className="tile is-ancestor">
          <div className="tile is-vertical is-9">
            <div className="tile">
              <div className="tile is-parent">
                <div className="tile is-child tile-is-white">

                  <div className="field">
                    <label className="label">
                      Name
                      { !concept &&
                        <span className="has-text-danger is-size-6 pl-1"> * </span>
                      }
                    </label>
                    <div className="control">
                      <input className="input" type="text" style={{borderColor: "#f5f5f5"}} value={name} onChange={(e: any) => setName(e.target.value)} />
                    </div>
                    { !concept &&
                      <p className="help is-danger">
                        This field is required
                      </p>
                    }
                  </div>

                </div>
              </div>

              <div className="tile is-parent is-vertical">
                <div className="tile is-child notification tile-is-white">
                  <div className="field pb-0">
                    <label className="label">
                      Data Type
                      { !concept &&
                        <span className="has-text-danger is-size-6 pl-1"> * </span>
                      }
                    </label>

                    { concept ?
                      <p className="fineprint-label label-size-3 is-left pt-1">
                        { dataType }
                      </p>
                    :
                      <Dropdown<[string, DataType]>
                        items={Object.entries(DataType)}
                        onClick={item => setDataType(item[1])}
                      />
                    }

                    { !concept &&
                      <p className="help is-danger">
                        This field is required
                      </p>
                    }
                  </div>
                </div>

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

              </div>
            </div>

            <div className="tile is-parent">
              <div className="tile is-child notification tile-is-white">

                <div className="field">
                  <label className="label">Description</label>
                  <div className="control">
                    <textarea className="input" style={{borderColor: "#f5f5f5", resize: "vertical", minHeight: "7.5rem"}} value={description} onChange={(e: any) => setDescription(e.target.value)} />
                  </div>
                </div>

              </div>
            </div>

            <div className="tile">
              <div className="tile is-parent">
                <div className="tile is-child notification tile-is-white">

                  <div className="field pb-0">
                    <label className="label">Parent</label>
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

          <div className="tile is-vertical">
            <div className="tile is-parent">
              <div className="tile is-child tile-is-white">

                <div className="field pb-0">
                  <div className="hover-buttons is-right">
                    <button className="hover-button is-small" onClick={handleAddConstraint}>
                      <span className="icon is-small">
                        <FontAwesomeIcon icon={faPlus} size="sm"/>
                      </span>
                    </button>
                  </div>

                  <label className="label">Constraints</label>

                  { renderConstraints }

                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <div className="buttons">
              { concept &&
                <div className="button is-danger is-outlined" onClick={handleDelete}> Delete </div>
              }
              <input type="submit" className="button is-primary is-outlined" value={concept ? "Update concept" : "Create concept"} />
            </div>
          </div>
        </div>

      </form>
    </div>
  )
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
              <ConceptDetail key={activeConcept?.id || "new"} concept={activeConcept} taxonomy={taxonomy} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TaxonomyRoute;
