import React, { FC, useEffect, useState }  from 'react'
import { useHistory } from "react-router-dom"

import { useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { getCSRFToken } from 'utils/getCSRFToken'

import { useAuthContext } from 'contexts'

import { DataSpace, Subscription } from 'types'


interface DSSettingsProps {
  isActive: boolean,
  onClose: () => void,
  dataSpace?: DataSpace,
  role?: string
}

const DSSettings: FC<DSSettingsProps> = ({ isActive, onClose, dataSpace, role }) => {
  const history = useHistory()
  const activeDataSpace = useAppSelector(selectActiveDataSpace)
  const ds = dataSpace || activeDataSpace

  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const { user } = useAuthContext()
  const userRole = ds?.handle !== "trial" ? role || user?.role : "collaborator"

  const newPlan = subscription && subscription.plan_name === "free" ? "standard" : "free"
  const updownGrade = newPlan && newPlan === "free" ? "Downgrade" : "Upgrade"

  useEffect(() => {
    if (userRole && userRole === "owner") {
      if (ds) {
        fetch(process.env.REACT_APP_API_BASE_PATH + `/subscriptions/info/${ds.handle}`, {
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
        }).then((subscription: Subscription) => {
          setSubscription(subscription)
          setIsLoading(false)
        }).catch((e) => {
          console.log(e)
        })
      }
    } else {
      setIsLoading(false)
    }
  }, [ ds, userRole ])

  const handleChange = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (subscription !== null && window.confirm("Are you sure you want to change your subscription plan?")) {
      fetch(process.env.REACT_APP_API_BASE_PATH + `/subscriptions/${subscription.subscription_id}/change_plan`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        },
        body: JSON.stringify({
          "plan": newPlan
        })
      }).then((response) => {
        onClose()
        history.push("/")
      }).catch((e) => {
        console.log(e)
      })
    }
  }

  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (window.confirm("Are you sure you want to delete this data space?")) {
      fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${ds.handle}/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        onClose()
        if (history.location.pathname === "/") {
          window.location.reload()
        } else {
          history.push("/")
        }
      }).catch((e) => {
        console.log(e)
      })
    }
  }

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (window.confirm("Are you sure you want to leave this data space?")) {
      fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${ds.handle}/leave`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        onClose()
        history.push("/")
      }).catch((e) => {
        console.log(e)
      })
    }
  }

  const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    history.push(`/ds/${ds.handle}/keys/rotate`)
  }

  const renderUpdateInfo = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Update billing information
          </h3>

          <p>
            Go to our payment provider to update your billing information
          </p>
        </div>

        <div className="column">
          <a className="button mt-1 is-success is-pulled-right" target="_blank" rel="noopener noreferrer" href={subscription?.update_url}>
            Update
          </a>
        </div>
      </div>
    </>
  )

  const renderCancel = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Cancel subscription
          </h3>

          <p>
            Your data space will be deleted at the end of the current billing cycle
          </p>
        </div>

        <div className="column">
          <a className="button mt-1 is-danger is-pulled-right" target="_blank" rel="noopener noreferrer" href={subscription?.cancel_url}>
            Cancel
          </a>
        </div>
      </div>
    </>
  )

  const renderChange = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Change subscription plan
          </h3>

          <p>
            { newPlan === "free" ?
              "Note that you will not be refunded for the remaining billing cycle"
            :
              "You will immediately be charged the prorated cost for upgrading"
            }
          </p>
        </div>

        <div className="column">
          <div className="button mt-1 is-success is-pulled-right" onClick={handleChange}>
            { updownGrade }
          </div>
        </div>
      </div>
    </>
  )

  const renderDelete = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Delete the <span className="is-italic"> { ds.name || ds.handle } </span> data space
          </h3>

          <p>
            This action cannot be undone!
          </p>
        </div>

        <div className="column">
          <div className="button mt-1 is-danger is-pulled-right" onClick={handleDelete}>
            Delete
          </div>
        </div>
      </div>
    </>
  )

  const renderLeave = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Leave the <span className="is-italic"> { ds.name || ds.handle } </span> data space
          </h3>

          <p>
            This action cannot be undone!
          </p>
        </div>

        <div className="column">
          <div className="button mt-1 is-danger is-pulled-right" onClick={handleLeave}>
            Leave
          </div>
        </div>
      </div>
    </>
  )

  const renderRotate = (
    <>
      <div className="columns">
        <div className="column is-two-thirds">
          <h3 className="has-text-weight-semibold">
            Rotate data space keys
          </h3>

          <p>
            This impacts all active users.
          </p>
        </div>

        <div className="column">
          <div className="button mt-1 is-success is-pulled-right" onClick={handleRotate}>
            Rotate
          </div>
        </div>
      </div>
    </>
  )

  // TODO: Handle info prompt with current cost + valid_to
  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content" style={{width: "50rem"}}>
          <div className="box">
            { isLoading ?
               <div className="spinner" />
            :
              <>
                { userRole === "owner" ?
                  <>
                    { subscription !== null &&
                      <>
                        { renderUpdateInfo }

                        <div className="divider mt-0"/>

                        { renderChange }

                        <div className="divider mt-0"/>

                        { renderCancel }

                        <div className="divider mt-0"/>
                      </>
                    }

                    { renderRotate }

                    <div className="divider mt-0"/>

                    { renderDelete }
                  </>
                :
                  <>
                    { renderLeave }
                  </>
                }
              </>
            }
          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
      </div>
    </>
  )
}

export default DSSettings;
