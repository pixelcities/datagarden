import React, { FC } from 'react'

import OnboardingSteps from 'components/OnboardingSteps'


const Onboarding: FC = () => {
  const steps = [
    {
      target: "#welcome",
      placementBeacon: "top-end",
      title: "Welcome to DataGarden",
      content: (
        <>
          <p className="has-text-justified">
            DataGarden is an end-to-end encrypted data collaboration platform.

            Everyone works together in <span className="has-text-weight-bold"> Data Spaces </span>, where you invite
            other users and organisations to collaborate together, in a secure and private manner.
          </p>
        </>
      )
    }
  ]

  return (
    <OnboardingSteps
      name={"onboarding-pages"}
      steps={steps}
    />
  )
}

export default Onboarding
