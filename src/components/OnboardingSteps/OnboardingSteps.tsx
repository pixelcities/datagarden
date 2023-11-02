import React, { FC, useEffect, useState } from 'react'
import Joyride, { CallBackProps, Step, ACTIONS, EVENTS, STATUS } from 'react-joyride'

import { useKeyStoreContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'


interface _Step extends Omit<Step, 'placementBeacon'> {
  placementBeacon?: any // Placement
}

interface OnboardingStepsI {
  name: string,
  steps: _Step[]
}

const OnboardingSteps: FC<OnboardingStepsI> = ({name, steps}) => {
  const { keyStoreIsReady } = useKeyStoreContext()

  const [isActive, setIsActive] = useState(false)
  const [retryBackoff, setRetryBackoff] = useState(0)
  const [cachedSteps, setCachedSteps] = useState<_Step[] | undefined>(undefined)
  const [timeoutID, setTimeoutID] = useState<number | undefined>()

  const getItem = (key: string) => {
    const maybe_value = localStorage.getItem(key)

    if (maybe_value !== null) {
      return Promise.resolve(maybe_value)

    } else {
      return fetch(process.env.REACT_APP_API_BASE_PATH + "/users/settings/" + key, {
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
      }).then(result => {
        if (!!result) {
          localStorage.setItem(key, result.value)
          return result.value
        } else {
          return result
        }
      }).catch((e) => {
        console.error(e)
      })
    }
  }

  const putItem = (key: string, value: string) => {
    localStorage.setItem(key, value)

    fetch(process.env.REACT_APP_API_BASE_PATH + "/users/settings", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFToken()
      },
      body: JSON.stringify({
        "key": key,
        "value": value
      })
    }).catch((e) => {
      console.error(e)
    })
  }

  // Only alter the steps on initial load
  useEffect(() => {
    let isCancelled = false

    getItem(name).then(value => {
      if (!isCancelled) {
        setCachedSteps(steps.slice(parseInt(value || "0")))
      }
    })

    return () => { isCancelled = true }
  }, [ name, steps ])

  const handleClose = (e: CallBackProps) => {
    if (e.type === EVENTS.TARGET_NOT_FOUND) {
      setIsActive(false)

      if (retryBackoff < 5) {
        setTimeout(() => {
          setIsActive(true)
        }, 100 * 2 ** retryBackoff)

        setRetryBackoff(retryBackoff + 1)
      }

    } else if (isActive) {
      if (e.status === STATUS.RUNNING && e.type === EVENTS.TOOLTIP) {
        if (timeoutID) {
          clearTimeout(timeoutID)
        }
      }

      if (e.type === EVENTS.STEP_AFTER) {
        const newIndex = e.index + (e.action === ACTIONS.PREV ? -1 : 1)
        putItem(name, newIndex.toString())

      } else if (e.status === STATUS.FINISHED || e.status === STATUS.SKIPPED) {
        putItem(name, "-1")
        setIsActive(false)
      }
    }
  }

  useEffect(() => {
    let isCancelled = false

    if (keyStoreIsReady) {
      getItem(name).then(value => {
        if (!isCancelled) {
          setIsActive(parseInt(value || "0") !== -1)
        }
      })
    }

    return () => { isCancelled = true }
  }, [ keyStoreIsReady, name ])

  // Disable after a while if the user doesn't interact with the onboarding
  useEffect(() => {
    const timeout = window.setTimeout(() => setIsActive(false), 7500)
    setTimeoutID(timeout)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      { (cachedSteps !== undefined) &&
        <Joyride
          run={isActive}
          steps={cachedSteps}
          styles={{
            options: {
              primaryColor: "#e49bcf"
            }
          }}
          continuous={true}
          callback={handleClose}
        />
      }
    </>
  )
}

export default OnboardingSteps
