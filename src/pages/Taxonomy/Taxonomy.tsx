import React, { FC, Component, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import Accordion from 'components/Accordion'
import Dropdown from 'components/Dropdown'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectActiveDataSpace, selectConcepts } from 'state/selectors'
import { createConcept, updateConcept } from 'state/actions'
import { ConceptA, DataType } from 'types'

import { emptyTaxonomy, loadTaxonomy } from 'utils/taxonomy'


class TaxonomyRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />

        <Sidebar page="taxonomy" isMini={false}>
          <Route path={this.parentPath} component={Taxonomy} />
        </Sidebar>
      </div>
    )
  }
}

interface ConceptDetailI {
  concept?: ConceptA
}

const ConceptDetail: FC<ConceptDetailI> = ({ concept }) => {
  const dispatch = useAppDispatch()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const [name, setName] = useState(concept?.name ?? "")
  const [dataType, setDataType] = useState(concept?.dataType)

  const handleSubmit = (e: any) => {
    e.preventDefault()

    if (concept) {
      const action = emptyTaxonomy(dataSpace?.key_id).serialize({
        id: concept.id,
        workspace: concept.workspace,
        name: name,
        dataType: dataType
      })

      if (action) {
        dispatch(updateConcept(action))
      }


    } else {
      const action = emptyTaxonomy(dataSpace?.key_id).serialize({
        id: crypto.randomUUID(),
        workspace: "default",
        name: name,
        dataType: dataType
      })

      if (action) {
        dispatch(createConcept(action))
      }

      setName("")
      setDataType(undefined)
    }
  }

  type keys = keyof typeof DataType

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
            <input className="input" type="text" value={name} onChange={(e: any) => setName(e.target.value)} />
          </div>
        </div>

        <div className="field pb-0">
          <label className="label">Data Type</label>
          <Dropdown
            items={["String", "RelativeNumber", "AbsoluteNumber"]}
            onClick={(item: string) => setDataType((DataType[item as keys]))}
          />
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

const Taxonomy: FC = (props) => {
  const concepts = useAppSelector(selectConcepts)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const taxonomy = useMemo(() => {
    if (dataSpace) {
      return loadTaxonomy(dataSpace.key_id, concepts)
    }
  }, [ dataSpace, concepts ])

  const renderConcepts = useMemo(() => {
    return taxonomy?.list().map(c => {
      return (
        <Accordion key={c.id}
          title={c.name}
        >
          <ConceptDetail
            concept={c}
          />
        </Accordion>
      )
    })
  }, [ taxonomy ])

  return (
    <div className="page px-0 pt-0">

      <div className="title">
        Taxonomy

        <div className="border" />
      </div>

      <div className="main px-4">

        { renderConcepts }

        <Accordion>
          <ConceptDetail />
        </Accordion>

      </div>
    </div>
  )
}

export default TaxonomyRoute;
