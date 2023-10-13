import React, { FC, useMemo, useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faAngleDoubleRight, faCheck, faTimes, faQuestion } from '@fortawesome/free-solid-svg-icons'
import { Mutex } from 'async-mutex'

import { ConceptA, DataType, SqlTypeMap } from 'types'
import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectConcepts } from 'state/selectors'
import { sendLocalNotification, createConcept } from 'state/actions'
import { useDataFusionContext } from 'contexts'

import DataTable from 'components/DataTable'
import ConceptDetail from 'components/ConceptDetail'
import Dropdown from 'components/Dropdown'

import { loadTaxonomy, Taxonomy } from 'utils/taxonomy'

import './ConceptPicker.sass'


interface ConceptPickerProps {
  tableId: string,
  attributes: {id: string, name: string}[],
  onComplete: (attributes: {id: string, concept_id: string}[]) => void,
  onClose: () => void
}

const ConceptPicker: FC<ConceptPickerProps> = ({ tableId, attributes, onComplete, onClose }) => {
  const dispatch = useAppDispatch()
  const { dataFusion } = useDataFusionContext()

  const existingConcepts = useAppSelector(selectConcepts)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [activeColumn, setActiveColumn] = useState(attributes[0].id)
  const [concepts, setConcepts] = useState<{[key: string]: ConceptA}>({})
  const [choices, setChoices] = useState<{[key: string]: 1 | 2}>({})
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const mutex = useMemo(() => new Mutex(), [])
  const conceptsRef = useRef<{[key: string]: ConceptA}>({})
  const choicesRef = useRef<{[key: string]: 1 | 2}>({})

  const finished = Object.keys(choices).length === Object.keys(attributes).length

  const taxonomy = useMemo(() => {
    if (dataSpace) {
      return loadTaxonomy(dataSpace.key_id, existingConcepts)
    }
  }, [ dataSpace, existingConcepts ])

  const allConcepts = useMemo(() => taxonomy?.list().map(c => [c.id, c.name] as [string, string]) || [], [ taxonomy ])

  useEffect(() => {
    (async () => {
      if (!isReady) {
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

        conceptsRef.current = concepts
        setConcepts(concepts)
        setIsReady(true)
      }
    })()
  }, [ tableId, attributes, dataFusion, isReady ])

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

  const handlePublish = () => {
    if (!taxonomy) {
      console.error("Taxonomy not loaded")
      return
    }

    // Publish the new concepts
    for (const [id, choice] of Object.entries(choices)) {
      if (choice === 2) {
        const concept = taxonomy.serialize(concepts[id])

        if (concept) {
          dispatch(createConcept(concept))
        }
      }
    }

    const newAttributes = Object.entries(concepts).map(([k, v]) => { return {id: k, concept_id: v.id} })

    // Return
    onComplete(newAttributes)
    setIsLoading(true)
  }

  const handleChange = useCallback((id: string, concept: ConceptA, newConcept: ConceptA) => {
    mutex.runExclusive(async () => {
      if (newConcept.dataType && newConcept.dataType !== concept.dataType) {
        const dataTypeKey = Object.keys(DataType)[Object.values(DataType).indexOf(newConcept.dataType)]

        const cloneId = dataFusion?.clone_table(tableId, "")
        const query = `SELECT CAST("${id}" AS  ${SqlTypeMap[dataTypeKey]}) AS "${id}" FROM "${tableId}"`
        dataFusion?.query(tableId, query).then((artifact: any) => {
          dataFusion?.apply_artifact(cloneId, artifact).then(() => {
            dataFusion?.merge_table(cloneId, tableId)
            dataFusion?.move_table(cloneId, tableId)

            conceptsRef.current[id] = newConcept
            setConcepts(JSON.parse(JSON.stringify(conceptsRef.current)))
          })
        }).catch((e: string) => {
          if (e.toString().indexOf("Cast error") !== -1) {
            onError(`Invalid data type for column "${concept.name}" (${newConcept.dataType})`)
          }
        })

      } else {
        conceptsRef.current[id] = newConcept
        setConcepts(JSON.parse(JSON.stringify(conceptsRef.current)))
      }
    })
  }, [ dataFusion, onError, tableId, mutex ])

  const handleChoice = useCallback((id: string, choice: 1 | 2) => {
    choicesRef.current[id] = choice
    setChoices(choicesRef.current)
  }, [])

  const renderChoices = useMemo(() => {
    return attributes.map(x => {
      return (
        <ConceptChoice
          key={x.id}
          id={x.id}
          name={x.name}
          concept={concepts[x.id]}
          allConcepts={allConcepts}
          taxonomy={taxonomy}
          isActive={x.id === activeColumn}
          onChoice={handleChoice}
          onChange={handleChange}
        />
      )
    })
  }, [ attributes, concepts, activeColumn, handleChange, handleChoice, taxonomy, allConcepts ])

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

                { isReady && renderChoices }

              </div>
            </div>

            <div className="buttons is-right pr-5" style={{height: "3.125rem"}}>
              { !finished &&
                <span className="fineprint-label pr-3 pb-1">
                  Please validate all columns before continuing
                </span>
              }

              <button className={"button is-medium is-primary" + (isLoading ? " is-loading" : "")} disabled={!finished} onClick={handlePublish}>
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
  name: string,
  concept: ConceptA | undefined,
  allConcepts: [string, string][],
  taxonomy: Taxonomy | undefined,
  isActive: boolean,
  onChoice: (id: string, choice: 1 | 2) => void,
  onChange: (id: string, concept: ConceptA, newConcept: ConceptA) => void
}

const ConceptChoice: FC<ConceptChoiceI> = ({ id, name, concept, allConcepts, taxonomy, isActive, onChoice, onChange }) => {
  const [isAuto, setIsAuto] = useState(true)
  const [isFirst, setIsFirst] = useState(true)
  const [createModalIsActive, setCreateModalIsActive] = useState(false)
  const [choice, setChoice] = useState(0)

  const selected = useMemo(() => {
    const maybeId = allConcepts.filter((x: [string, string]) => concept?.id === x[0])

    if (maybeId.length > 0) {
      return maybeId[0]
    }
  }, [ allConcepts, concept ])

  useEffect(() => {
    if (!selected && isFirst && concept) {
      const maybeNew = taxonomy?.list().filter(x => x.name.toLowerCase() === concept.name.toLowerCase()) || []

      if (maybeNew.length > 0) {
        setChoice(1)
        onChange(id, concept, maybeNew[0])
        setIsFirst(false)
      }
    }
  }, [ selected, taxonomy, concept, setChoice, id, isFirst, onChange ])

  const existingIsOk = !!selected
  const newIsOk = !!concept?.name

  const existingChoice = choice ===1 && existingIsOk
  const newChoice = choice === 2 && newIsOk

  useEffect(() => {
    if (existingChoice) {
      onChoice(id, 1)
    } else if (newChoice) {
      onChoice(id, 2)
    }
  }, [ id, existingChoice, newChoice, onChoice ])

  const handleSelect = (item: [string, string]) => {
    const newConcept = taxonomy?.get(item[0])

    if (concept && newConcept) {
      onChange(id, concept, newConcept)
    }
  }

  const createModal = useMemo(() => {
    const handleChange = (newConcept: ConceptA) => {
      setCreateModalIsActive(false)

      if (concept) {
        onChange(id, concept, newConcept)
      }
    }

    return (
      <Portal>
        { createModalIsActive &&
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
                      taxonomy={taxonomy}
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
        }
      </Portal>
    )
  }, [ createModalIsActive, id, concept, onChange, taxonomy ])

  if (!isActive) {
    return (
      <></>
    )
  }

  return (
    <>
      { createModal }

      <div className={"plaque mb-3" + (choice === 1 ? " is-active" : "")} onClick={() => setChoice(1)}>
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
              {name}:
            </p>
            <div style={{display: "block"}}>
              <Dropdown
                key={selected ? selected[0] : "empty"}
                items={allConcepts}
                selected={selected}
                onClick={handleSelect}
                isDisabled={choice !== 1}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={"plaque mb-3" + (choice === 2 ? " is-active" : "")} onClick={() => setChoice(2)}>
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
