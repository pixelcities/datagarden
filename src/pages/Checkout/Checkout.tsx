import React, { FC, Component, useState, useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, useHistory } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faEquals, faPlus, faDollarSign, faCheck } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import NotificationsBar from 'components/NotificationsBar'
import Section from 'components/Section'
import Footer from 'components/Footer'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'
import { signObject } from 'utils/integrity'


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

const Checkout: FC<RouteComponentProps> = ({ location }) => {
  const checkoutId = new URLSearchParams(location.search).get("checkout")
  const isComplete = checkoutId !== null

  const history = useHistory()
  const { user } = useAuthContext()
  const { keyStore } = useKeyStoreContext()

  const [step, setStep] = useState(isComplete ? 3 : 0)
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [plan, setPlan] = useState("Standard")
  const [auto, setAuto] = useState(true)
  const [noFree, setNoFree] = useState(false)
  const [interval, setInterval] = useState("monthly")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isCancelled = false

    fetch(process.env.REACT_APP_API_BASE_PATH + "/subscriptions/plan?plan=free", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(response)
      } else {
        return response.json()
      }
    }).then(({ is_available }) => {
      if (!isCancelled) {
        setNoFree(!is_available)
      }
    }).catch((e) => {
      console.log(e);
    })

    return () => { isCancelled = true }
  }, [])

  useEffect(() => {
    if (isComplete) {
      fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/activate/${checkoutId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        if (response.ok) {
          history.push("/")
        }
      }).catch((e) => {
        console.log(e);
      })
    }
  }, [ isComplete, checkoutId, history ])

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setStep(1)
  }

  const handleFreePlan = () => {
    setPlan("Free")
    setStep(2)
  }

  const handleStandardPlan = () => {
    setPlan("Standard")
    setStep(2)
  }

  const sluggify = (e: string) => e.replaceAll(" ", "_").toLowerCase().replace(/[^\w]+/g, "").substring(0, 63)

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

  const submitRequest = () => {
    if (user) {
      setIsLoading(true)

      keyStore?.generate_key(32).then((key_id: string) => {
        signObject({users: [user.id], tag: undefined}, keyStore?.get_key(key_id)).then((signedManifest) => {
          fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${handle}/create`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": getCSRFToken()
            },
            body: JSON.stringify({
              "name": name,
              "key_id": key_id,
              "manifest": signedManifest,
              "plan": plan.toLowerCase(),
              "interval": interval
            })
          }).then((response) => {
            if (!response.ok) {
              return Promise.reject(response)
            } else {
              return response.json()
            }
          }).then(({ uri }) => {
            window.location.href = uri
          }).catch((e) => {
            console.log(e);
          })
        })
      })
    }
  }

  const renderCost = useMemo(() => {
    let base = 20

    if (plan === "Free") {
      return (
        <p> - </p>
      )
    }

    return (
      <p>
        ${base}
        <span className="icon is-small mx-1" >
          <FontAwesomeIcon icon={faTimes} size="xs"/>
        </span>
        1 member
        <span className="icon is-small mx-1" >
          <FontAwesomeIcon icon={faTimes} size="xs"/>
        </span>
        1 month
        <span className="icon is-small mx-3" >
          <FontAwesomeIcon icon={faEquals} size="xs"/>
        </span>
        <span className="is-size-6">$</span><span className="is-size-5 has-text-weight-semibold">{base}</span>
      </p>
    )
  }, [ plan ])

  const renderCreateStep = (
    <form className="is-flex is-justify-content-center is-align-items-center" onSubmit={handleCreateSubmit}>
      <div className="box">
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
            <input className="input" type="text" placeholder="Name" minLength={3} required={true} value={name} onChange={handleName} />
          </div>
        </div>

        <div className="field">
          <label className="label">Identifier</label>
          <div className="control">
            <input className="input" type="text" placeholder="unique_handle" minLength={3} maxLength={63} required={true} value={handle} onChange={handleHandle} />
          </div>
          <p className="help pr-3" style={{maxWidth: "680px"}}>
            A unique handle that is used to identify your Data Space. Note that this identifier will be part of any URLs you publically share.
            You <span className="has-text-weight-semibold"> cannot </span> change your identifier afterwards.
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
    <div className="is-flex is-justify-content-center is-align-items-center">
      <div className="box">
        <div className="columns is-centered is-mobile">
          <div className="column is-5 has-tooltip-arrow" style={noFree ? {color: "#ccc"} : {}} data-tooltip={noFree ? "Maximum number of free data spaces reached!" : undefined}>
            <h3 className="header-label label-size-4 py-5 is-justify-content-center" style={noFree ? {color: "#ccc"} : {}}>
              Early bird
            </h3>

            <p className="has-text-justified" style={{minHeight: "6rem"}}>
              Create a data space and invite up to two other members, for free!, for as long as DataGarden is in beta.
              Get started quickly and explore the platform.
            </p>

            <h3 className="has-text-centered py-6">
              <span className="is-size-6">$</span><span className="is-size-4 has-text-weight-semibold">0</span>
            </h3>

            <p className="has-text-centered pb-6">
              Up to three members
            </p>

            <div className="pb-3">
              <button className="button is-primary is-fullwidth" onClick={handleFreePlan} disabled={noFree}>
                <span className="has-text-weight-semibold"> Continue for free </span>
              </button>
            </div>
          </div>

          <div className="column is-1 divider is-vertical mx-0" />

          <div className="column is-5">
            <h3 className="header-label label-size-4 py-5 is-justify-content-center">
              Standard
            </h3>

            <p className="has-text-justified" style={{minHeight: "6rem"}}>
              Kickstart your data collaborative! Create your own private data space, and share and analyse your data securely, with unlimited members.
            </p>

            <h3 className="has-text-centered py-6">
              <span className="is-size-6">$</span><span className="is-size-4 has-text-weight-semibold">20</span>
            </h3>

            <p className="has-text-centered pb-6">
              Per member / month
            </p>

            <div className="pb-3">
              <div className="button is-primary is-fullwidth" onClick={handleStandardPlan}>
                <span className="has-text-weight-semibold"> Continue with Standard </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  const renderConfirmationStep = (
    <div>
      <div className="notification is-success mx-6" style={{marginTop: "-2rem"}}>
        In order to complete the checkout, you will leave this website and be taken to our payment processor.
        Paddle will handle all payment information, view their privacy policy <a target="_blank" rel="noopener noreferrer" href="https://paddle.com/privacy-buyers">here</a>.
      </div>

      <>
        <div className="box">
          <div className="columns is-centered is-mobile">
            <div className="column is-5">
              <h2 className="subtitle is-5">
                Data Space Details
              </h2>

              <div className="field">
                <label className="label">Name</label>
                <div className="control">
                  <input className="input is-static" type="text" value={name} readOnly />
                </div>
              </div>

              <div className="field">
                <label className="label">Identifier</label>
                <div className="control">
                  <input className="input is-static" type="text" value={handle} readOnly />
                </div>
              </div>
            </div>

            <div className="column is-1 divider is-vertical mx-0" />

            <div className="column is-5">
              <h2 className="subtitle is-5">
                Subscription Details
              </h2>

              <div className="field">
                <label className="label">Subscription Plan</label>
                <div className="control">
                  <input className="input is-static" type="text" value={plan} readOnly />
                </div>
              </div>

              { plan !== "Free" &&
                <div className="field">
                  <label className="label">Billing Interval</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInterval(e.target.value)} value={interval}>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              }

              <div className="field">
                <label className="label">Subscription Cost</label>
                <div className="control">
                  { renderCost }
                </div>
                { plan !== "Free" ?
                  <p className="help pr-3">
                    You are starting the subscription with just yourself in the <span className="is-italic">{handle}</span> Data Space. When new members join, they will be added to your next bill.
                  </p>
                :
                  <p className="help pr-3">
                    While this plan is free, it does require an active and valid credit card. You will never be automatically upgraded to a paid plan, although you can manually do so yourself.
                  </p>
                }

              </div>

              <div className="field">
                <button className={"button is-primary is-fullwidth" + (!user || isLoading ? " is-loading" : "")} onClick={submitRequest}>
                  Continue to payment
                </button>
              </div>

            </div>
          </div>
        </div>

      </>
    </div>
  )

  const renderComplete = (
    <>
      <h1 className="subtitle is-size-4 has-text-centered pb-6">
        Finalizing your brand new data space
      </h1>

      <div className="spinner" />

      <p className="has-text-centered pt-6">
        Processing..
      </p>
    </>
  )

  return (
    <Section backdrop={true}>
      <div className="container is-max-desktop" id="no-px-mobile">

        <ul className="steps is-narrow is-medium is-centered has-content-centered pb-6">
          <li className={"steps-segment" + (step === 0 ? " is-active has-gaps" : "")}>
            <span className={step >= 0 && !isComplete ? "is-clickable" : ""} onClick={() => step >= 0 && !isComplete && setStep(0)}>
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
            <span className={step >= 1 && !isComplete ? "is-clickable" : ""} onClick={() => step >= 1 && !isComplete && setStep(1)}>
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
        { step === 2 && renderConfirmationStep }
        { isComplete && renderComplete }

      </div>
    </Section>
  )
}

export default CheckoutRoute;
