import React, { FC, Component, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faDollarSign, faCheck } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import NotificationsBar from 'components/NotificationsBar'
import Section from 'components/Section'
import Footer from 'components/Footer'

import { useAuthContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'


class CheckoutRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />
        <NotificationsBar />

        <Route path={this.parentPath} component={Checkout} />

        <Footer />
      </div>
    )
  }
}

const Checkout: FC = (props) => {
  const { user } = useAuthContext()

  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [auto, setAuto] = useState(true)

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setStep(1)
  }

  const handlePlanSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setStep(2)
  }


  const sluggify = (e: string) => e.replaceAll(" ", "_").toLowerCase().replace(/[^\w]+/g, "")

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (auto) {
      setHandle(sluggify(e.target.value))
    }

    setName(e.target.value)
  }

  const handleHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuto(false)
    setHandle(sluggify(e.target.value))
  }

  const renderCreateStep = (
    <form className="is-flex is-justify-content-center is-align-items-center" onSubmit={handleCreateSubmit}>
      <div className="box">
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
            <input className="input" type="text" placeholder="Name" value={name} onChange={handleName} />
          </div>
        </div>

        <div className="field">
          <label className="label">Identifier</label>
          <div className="control">
            <input className="input" type="text" placeholder="unique_handle" value={handle} onChange={handleHandle} />
          </div>
          <p className="help pr-3">
            A unique handle that is used to identify your data space. Note that this identifier will be part of any URLs you publically share.
          </p>
        </div>

        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <input type="submit" className="button is-primary" value="Continue" />
          </div>
        </div>
      </div>
    </form>
  )

  const renderPlanStep = (
    <form className="is-flex is-justify-content-center is-align-items-center" onSubmit={handlePlanSubmit}>
      <div className="box">
        <div className="field is-grouped is-grouped-right">
          <div className="control">
            <input type="submit" className="button is-primary" value="Continue" />
          </div>
        </div>
      </div>
    </form>
  )

  return (
    <Section backdrop={true}>
      <div className="container is-max-desktop" id="no-px-mobile">

        <ul className="steps is-narrow is-medium is-centered has-content-centered pb-6">
          <li className={"steps-segment" + (step === 0 ? " is-active has-gaps" : "")}>
            <span className={step >= 0 ? "is-clickable" : ""} onClick={() => step >= 0 && setStep(0)}>
              <span className="steps-marker">
                <span className="icon is-small" >
                  <FontAwesomeIcon icon={faPlus} size="sm"/>
                </span>
              </span>
              <div className="steps-content">
                <h3 className="heading pt-3">Create Data Space</h3>
              </div>
            </span>
          </li>
          <li className={"steps-segment" + (step > 1 ? "" : " has-gaps") + (step === 1 ? " is-active" : "")}>
            <span className={step >= 1 ? "is-clickable" : ""} onClick={() => step >= 1 && setStep(1)}>
              <span className={"steps-marker" + (step < 1 ? " is-hollow" : "")}>
                <span className="icon is-small" >
                  <FontAwesomeIcon icon={faDollarSign} size="sm"/>
                </span>
              </span>
              <div className="steps-content">
                <h3 className="heading pt-3">Choose Plan</h3>
              </div>
            </span>
          </li>
          <li className={"steps-segment" + (step === 2 ? " is-active has-gaps" : "")}>
            <span className={"steps-marker" + (step < 2 ? " is-hollow" : "")}>
              <span className="icon is-small" >
                <FontAwesomeIcon icon={faCheck} size="sm"/>
              </span>
            </span>
            <div className="steps-content">
              <h3 className="heading pt-3">Confirmation</h3>
            </div>
          </li>
        </ul>

        { step === 0 && renderCreateStep }
        { step === 1 && renderPlanStep }

      </div>
    </Section>
  )
}

export default CheckoutRoute;
