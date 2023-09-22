import React, { FC, useMemo, useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faAngleDoubleRight, faCheck, faTimes, faQuestion } from '@fortawesome/free-solid-svg-icons'

import { useAppDispatch } from 'hooks'
import { ConceptA, DataType, SqlTypeMap } from 'types'
import { sendLocalNotification } from 'state/actions'
import { useDataFusionContext } from 'contexts'

import DataTable from 'components/DataTable'
import ConceptDetail from 'components/ConceptDetail'
import Dropdown from 'components/Dropdown'

import './ConceptPicker.sass'


interface ConceptPickerProps {
  tableId: string,
  attributes: {id: string, name: string}[],
  onClose: () => void
}

const ConceptPicker: FC<ConceptPickerProps> = ({ tableId, attributes, onClose }) => {
  const dispatch = useAppDispatch()
  const { dataFusion } = useDataFusionContext()

  const [activeColumn, setActiveColumn] = useState(attributes[0].id)
  const [concepts, setConcepts] = useState<{[key: string]: ConceptA}>({})

  useEffect(() => {
    (async () => {
      const tableDescription: any = await dataFusion.describe_table(tableId)

      let concepts: {[key: string]: ConceptA} = {}

      for (let attribute of attributes) {
        const description = tableDescription.descriptions.find((d: any) => d.name === attribute.id)

        let dataType = DataType.Other
        let aggregateFn = "array_agg"

        if (description) {
          if (description.data_type.indexOf("Int") !== -1 || description.data_type.indexOf("Float") !== -1) {
            // Very basic check to auto assign the right aggregate function type
            if (description.min > 0 && (description.max <= 1 || description.max <= 100)) {
              dataType = description.data_type.indexOf("Int") !== -1 ? DataType.RelativeInteger : DataType.RelativeDecimal
              aggregateFn = "avg"

            } else {
              dataType = description.data_type.indexOf("Int") !== -1 ? DataType.AbsoluteInteger : DataType.AbsoluteDecimal
              aggregateFn = "sum"
            }
          }

          if (description.data_type === "Utf8") {
            dataType = DataType.String
          }
        }

        concepts[attribute.id] = {
          id: crypto.randomUUID(),
          workspace: "default",
          name: attribute.name,
          dataType: dataType,
          aggregateFn: aggregateFn
        }
      }

      setConcepts(concepts)

    })()
  }, [ tableId, attributes, dataFusion ])

  const schema = useMemo(() => {
    return {
      id: tableId,
      key_id: "",
      column_order: attributes.map(x => x.id),
      columns: attributes.map(x => {
        return {
          id: x.id,
          concept_id: "",
          key_id: "",
          lineage: "",
          shares: []
        }
      }),
      shares: [],
      tag: ""
    }
  }, [ tableId, attributes ])

  const headerMapping = useMemo(() => {
    let mapping: {[key: string]: string} = {}

    for (const attribute of attributes) {
      mapping[attribute.id] = attribute.name
    }

    return mapping
  }, [ attributes ])

  const onError = useCallback((error: string) => {
    console.error(error)

    dispatch(sendLocalNotification({
      id: crypto.randomUUID(),
      type: "error",
      message: error,
      is_urgent: true,
      is_local: true
    }))
  }, [ dispatch ])

  const handlePrev = () => {
    const i = attributes.findIndex(x => x.id === activeColumn)
    setActiveColumn(attributes[Math.max(0, i - 1)].id)
  }

  const handleNext = () => {
    const i = attributes.findIndex(x => x.id === activeColumn)
    setActiveColumn(attributes[Math.min(attributes.length - 1, i + 1)].id)
  }

  const handleChange = useCallback((id: string, concept: ConceptA, newConcept: ConceptA) => {
    if (newConcept.dataType && newConcept.dataType !== concept.dataType) {
      const dataTypeKey = Object.keys(DataType)[Object.values(DataType).indexOf(newConcept.dataType)]

      const cloneId = dataFusion?.clone_table(tableId, "")
      const query = `SELECT CAST("${id}" AS  ${SqlTypeMap[dataTypeKey]}) AS "${id}" FROM "${tableId}"`
      dataFusion?.query(tableId, query).then((artifact: any) => {
        dataFusion?.apply_artifact(cloneId, artifact).then(() => {
          dataFusion?.merge_table(cloneId, tableId)
          dataFusion?.move_table(cloneId, tableId)

          setConcepts({...concepts, ...{[id]: newConcept}})
        })
      }).catch(() => {
        onError("Invalid data type")
      })

    } else {
      setConcepts({...concepts, ...{[id]: newConcept}})
    }
  }, [ dataFusion, onError, concepts, tableId ])

  const renderChoices = useMemo(() => {
    return attributes.map(x => {
      return (
        <ConceptChoice
          key={x.id}
          id={activeColumn}
          concept={concepts[activeColumn]}
          isActive={x.id === activeColumn}
          onCreate={handleChange}
          onExisting={() => {}}
        />
      )
    })
  }, [ attributes, concepts, activeColumn, handleChange ])

  return (
    <div className="container">
      <div className="div is-vcentered">
        <div className="box">
          <div style={{position: "relative", width: "80vw", height: "80vh"}}>

            <h2 className="title is-4 pt-3 pl-2" style={{height: "3rem"}}>
              Validate concepts
            </h2>

            <p className="subtitle is-5 pl-2" style={{height: "1.5rem"}}>
              Assign new or existing concepts by clicking on a column header.
            </p>

            <div className="columns mb-0" style={{height: "calc(100% - 4.5rem - 3.125rem - 0.5rem)"}}>

              <div className="column is-5">
                <h2 className="subtitle is-size-6 pl-2 mb-0" style={{height: "1.75rem"}}>
                  1. Select the column to verify
                </h2>

                <div style={{position: "relative", height: "calc(100% - 1.75rem)", width: "100%"}}>
                  <DataTable
                    id={tableId}
                    schema={schema}
                    interactiveHeader={false}
                    style={{height: "100%", width: "100%"}}
                    highlightHeader={true}
                    highlightColumn={activeColumn}
                    headerMapping={headerMapping}
                    onHeaderClick={(id) => setActiveColumn(id)}
                    preview={true}
                  />
                </div>

                <div className="columns">
                  <div className="column is-half">
                    <div className="is-pulled-left is-clickable" style={{maxWidth: "75%"}} onClick={handlePrev}>
                      <div className="is-relative">
                      <p className="subtitle is-5 pl-3">
                        <span>
                          <FontAwesomeIcon icon={faAngleLeft} size="lg"/>
                        </span>

                        <span style={{color: "#bdbdbd", paddingLeft: "1rem"}}> Previous </span>
                      </p>
                      </div>
                    </div>
                  </div>
                  <div className="column is-half">
                    <div className="is-pulled-right is-clickable" style={{maxWidth: "75%"}} onClick={handleNext}>
                      <div className="is-relative">
                      <p className="subtitle is-5 pr-3">
                        <span style={{color: "#bdbdbd", paddingRight: "1rem"}}> Next </span>

                        <span>
                          <FontAwesomeIcon icon={faAngleRight} size="lg"/>
                        </span>
                      </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="divider is-vertical my-4">
                <p>
                  <span>
                    <FontAwesomeIcon icon={faAngleDoubleRight} size="2x"/>
                  </span>
                </p>
              </div>

              <div className="column">
                <h2 className="subtitle is-size-6 pl-2">
                  2. Pick the best action for this column
                </h2>

                { renderChoices }

              </div>
            </div>

            <div className="buttons is-right pr-3" style={{height: "3.125rem"}}>
              <span className="fineprint-label pr-3 pb-1">
                Please validate all columns before continuing
              </span>

              <button className="button is-medium is-primary" disabled>
                Publish
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

interface ConceptChoiceI {
  id: string,
  concept: ConceptA | undefined,
  isActive: boolean,
  onCreate: (id: string, concept: ConceptA, newConcept: ConceptA) => void,
  onExisting: (conceptId: string) => void
}

const ConceptChoice: FC<ConceptChoiceI> = ({ id, concept, isActive, onCreate, onExisting }) => {
  const [isAuto, setIsAuto] = useState(true)
  const [existingIsOk, setExistingIsOk] = useState(false)
  const [createModalIsActive, setCreateModalIsActive] = useState(false)
  const [choice, setChoice] = useState(0)

  const newIsOk = !!concept?.name

  const handleChoice = (i: 1 | 2) => {
    setChoice(i)
  }

  const createModal = useMemo(() => {
    const handleChange = (newConcept: ConceptA) => {
      setCreateModalIsActive(false)

      if (concept) {
        onCreate(id, concept, newConcept)
      }
    }

    return (
      <Portal>
        <div className={"modal " + (createModalIsActive ? "is-active" : "")}>
          <div className="modal-background"/>

          <div className="container">
            <div className="div is-vcentered">
              <div style={{position: "relative", width: "50vw", height: "70vh"}}>
                <div className="box" style={{height: "100%", width: "calc(100% - 1rem)", overflowY: "scroll", backgroundColor: "#f5f5f5"}}>
                  <h1 className="title is-size-4">
                    Create new concept
                  </h1>

                  <ConceptDetail
                    concept={concept}
                    taxonomy={undefined}
                    onComplete={() => {}}
                    onChange={handleChange}
                    hideConstraints={true}
                    isCreate={true}
                    allowTypeChange={true}
                  />
                </div>

              </div>
            </div>
          </div>

          <button className="modal-close is-large" aria-label="close" onClick={() => setCreateModalIsActive(false)} />
        </div>
      </Portal>
    )
  }, [ createModalIsActive, id, concept, onCreate ])

  if (!isActive) {
    return (
      <></>
    )
  }

  return (
    <>
      { createModal }

      <div className={"plaque mb-3" + (choice === 1 ? " is-active" : "")} onClick={() => handleChoice(1)}>
        <div className="plaque-icon">
          <span>
            <FontAwesomeIcon icon={choice === 0 ? faQuestion : choice === 1 ? existingIsOk ? faCheck : faQuestion : faTimes} size="sm"/>
          </span>
        </div>

        <h3 className="header-label label-size-1 pb-3">
          Re-use existing concept
        </h3>

        <div className="plaque-content">
          <div className="field is-horizontal">
            <p className="header-label is-flex is-align-items-center pr-3">
              {concept?.name}:
            </p>
            <div style={{display: "block"}}>
              <Dropdown
                items={["1", "2"]}
                onClick={() => setExistingIsOk(true)}
                selected={null}
                isDisabled={choice !== 1}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={"plaque mb-3" + (choice === 2 ? " is-active" : "")} onClick={() => handleChoice(2)}>
        <div className="plaque-icon">
          <span>
            <FontAwesomeIcon icon={choice === 0 ? faQuestion : choice === 2 ? newIsOk ? faCheck : faQuestion : faTimes} size="sm"/>
          </span>
        </div>

        <h3 className="header-label label-size-1 pb-3">
         { isAuto ? "(Auto) " : "" }Create new concept
        </h3>

        <div style={{position: "absolute", top: "10px", right: "10px"}}>
          <button className="button is-small is-primary is-inverted" onClick={() => {setIsAuto(false); setCreateModalIsActive(true)} } disabled={choice !== 2}>
            Edit
          </button>
        </div>

        <div className="columns">
          <div className="column">
            <div className="field is-horizontal py-0">
              <p className="header-label pr-3">
                Title:
              </p>
              <input className="input" type="text" value={concept?.name || ""} disabled />
            </div>

            <div className="field is-horizontal py-0">
              <p className="header-label pr-3">
                Description
              </p>
              <input className="input" type="text" value={concept?.description || ""} disabled />
            </div>

          </div>

          <div className="column">
            <div className="field is-horizontal py-0">
              <p className="header-label pr-3">
                Data Type:
              </p>
              <input className="input" type="text" value={concept?.dataType || ""} disabled />
            </div>

            <div className="field is-horizontal py-0">
              <p className="header-label pr-3">
                Aggregate:
              </p>
              <input className="input" type="text" value={concept?.aggregateFn || ""} disabled />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

const Portal: FC = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}


export default ConceptPicker
