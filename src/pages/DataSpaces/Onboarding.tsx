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
    },
    {
      target: "#trial-space",
      content: (
        <>
          <p className="has-text-justified">

            You have already been invited to a trial data space. When invited to a data space, you receive some
            secrets that enable you to interact with the environment.
          </p>
          <br />
          <p className="has-text-justified">
            Note that within a data space other users may see some your personal information, they are your collaborators after all!
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
