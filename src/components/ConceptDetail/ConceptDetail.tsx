import React, { FC, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import Dropdown from 'components/Dropdown'
import Constraint from 'components/Constraint'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { createConcept, updateConcept, deleteConcept } from 'state/actions'
import { ConceptA, Rule, DataType } from 'types'

import { emptyTaxonomy, Taxonomy } from 'utils/taxonomy'


interface ConceptDetailI {
  concept?: ConceptA,
  taxonomy?: Taxonomy,
  onComplete: (id: string) => void,
  onChange?: (concept: ConceptA) => void,
  hideConstraints?: boolean,
  isCreate?: boolean,
  allowTypeChange?: boolean
}

const ConceptDetail: FC<ConceptDetailI> = ({ concept, taxonomy, onComplete, onChange, hideConstraints = false, isCreate = false, allowTypeChange = false }) => {
  const dispatch = useAppDispatch()
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

      onComplete("new")
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
    const newConcept = {
      id: id,
      workspace: concept?.workspace || "default",
      name: name,
      dataType: dataType,
      aggregateFn: aggregateFn,
      description: description,
      broader: broader,
      constraints: constraints.filter((x): x is Rule => !!x)
    }

    const action = emptyTaxonomy(dataSpace?.key_id).serialize(newConcept)

    if (action && !onChange) {
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

    if (onChange) {
      onChange(newConcept)
    } else {
      onComplete(id)
    }
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
          <div className={"tile is-vertical" + (hideConstraints === true ? " is-12" : " is-9")}>
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

                    { concept && !allowTypeChange ?
                      <p className="fineprint-label label-size-3 is-left pt-1">
                        { dataType }
                      </p>
                    :
                      <Dropdown<DataType>
                        items={Object.values(DataType)}
                        selected={concept ? concept.dataType : null}
                        onClick={item => setDataType(item)}
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

          { hideConstraints !== true &&
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
          }

          </div>

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <div className="buttons">
              { concept && !isCreate &&
                <div className="button is-danger is-outlined" onClick={handleDelete}> Delete </div>
              }
              <input type="submit" className="button is-primary is-outlined" value={concept && !isCreate ? "Update concept" : "Create concept"} />
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

export default ConceptDetail
