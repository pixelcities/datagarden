import React, { FC, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faCheck, faTimes, faQuestion } from '@fortawesome/free-solid-svg-icons'

import DataTable from 'components/DataTable'
import ConceptDetail from 'components/ConceptDetail'
import Dropdown from 'components/Dropdown'

import './ConceptPicker.sass'


interface ConceptPickerProps {
  tableId: string,
  attributes: {id: string, concept_id: string, name: string}[],
  onClose: () => void
}

const ConceptPicker: FC<ConceptPickerProps> = ({ tableId, attributes, onClose }) => {
  const [activeColumn, setActiveColumn] = useState(attributes[0].id)

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

  const handlePrev = () => {
    const i = attributes.findIndex(x => x.id === activeColumn)
    setActiveColumn(attributes[Math.max(0, i - 1)].id)
  }

  const handleNext = () => {
    const i = attributes.findIndex(x => x.id === activeColumn)
    setActiveColumn(attributes[Math.min(attributes.length - 1, i + 1)].id)
  }

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

              <div className="column is-half">
                <div style={{position: "relative", height: "100%", width: "100%"}}>
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

              <div className="column is-half">
                { /*
                <div className="box" style={{height: "100%", width: "calc(100% - 1rem)", overflowY: "scroll", backgroundColor: "#f5f5f5"}}>
                  <ConceptDetail
                    concept={undefined}
                    taxonomy={undefined}
                    onComplete={() => {}}
                    hideConstraints={true}
                  />
                </div>
                */
                }

                <ConceptChoice
                  key={activeColumn}
                  id={activeColumn}
                  name={headerMapping[activeColumn]}
                />

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

interface ConceptChoice {
  id: string,
  name: string
}

const ConceptChoice: FC<ConceptChoice> = ({ id, name }) => {
  const [isAuto, setIsAuto] = useState(true)
  const [isActive, setIsActive] = useState(1)
  const [existingIsOk, setExistingIsOk] = useState(false)
  const [newIsOk, setNewIsOk] = useState(false)

  const handleChoice = (i: 0 | 1) => {
    setIsActive(i)
  }

  return (
    <>
      <div className={"plaque mb-3" + (isActive === 0 ? " is-active" : "")} onClick={() => handleChoice(0)}>
        <div className="icon">
          <span>
            <FontAwesomeIcon icon={isActive === 0 ? existingIsOk ? faCheck : faQuestion : faTimes} size="sm"/>
          </span>
        </div>

        <h3 className="header-label label-size-2">
          Re-use existing concept
        </h3>

        <div className="plaque-content">
          <div className="field is-horizontal">
            <p className="header-label is-flex is-align-items-center pr-3">
              {name}:
            </p>
            <div style={{position: "relative"}}>
              <Dropdown
                items={["1", "2"]}
                onClick={() => setExistingIsOk(true)}
                selected={null}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={"plaque mb-3" + (isActive === 1 ? " is-active" : "")} onClick={() => handleChoice(1)}>
        <div className="icon">
          <span>
            <FontAwesomeIcon icon={isActive === 1 ? newIsOk ? faCheck : faQuestion : faTimes} size="sm"/>
          </span>
        </div>

        <h3 className="header-label label-size-2">
         { isAuto ? "(Auto) " : "" }Create new concept
        </h3>

        <div className="columns">
          <div className="column">
            <div className="field is-horizontal">
              <p className="header-label pr-3">
                Title:
              </p>
              <input className="input" type="text" value={name} disabled />
            </div>
          </div>

          <div className="column">
            <div className="field is-horizontal">
              <p className="header-label pr-3">
                Data Type:
              </p>
              <input className="input" type="text" value={"String"} disabled />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}


export default ConceptPicker
