import React, { FC, useEffect, useMemo, useState } from 'react'
import Joyride, { CallBackProps, Step, ACTIONS, EVENTS, STATUS } from 'react-joyride'

import { useKeyStoreContext } from 'contexts'


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

  // Only alter the steps on initial load
  const cachedSteps = useMemo(() => {
    return steps.slice(parseInt(localStorage.getItem(name) || "0"))
  }, [name, steps] )

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
      if (e.type === EVENTS.STEP_AFTER) {
        const newIndex = e.index + (e.action === ACTIONS.PREV ? -1 : 1)
        localStorage.setItem(name, newIndex.toString())

      } else if (e.status === STATUS.FINISHED || e.status === STATUS.SKIPPED) {
        localStorage.setItem(name, "-1")
        setIsActive(false)
      }
    }
  }

  useEffect(() => {
    if (keyStoreIsReady) {
      setIsActive(parseInt(localStorage.getItem(name) || "0") !== -1)
    }
  }, [ keyStoreIsReady, name ])


  return (
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
  )
}

export default OnboardingSteps
