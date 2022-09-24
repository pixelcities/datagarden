import React, { FC } from 'react'

import OnboardingSteps from 'components/OnboardingSteps'


const Onboarding: FC = () => {
  const steps = [
    {
      target: "#sources-intro",
      placementBeacon: "top-end",
      title: "Adding a new data source",
      content: (
        <>
          <p className="has-text-justified">
            All data sources are first loaded into your browser without leaving the computer. Next, you can setup what other
            users within this data space should be able to see this data, down to the column. The data is then encrypted and
            uploaded so that it can be reused in the future.
          </p>
          <br />
          <p className="has-text-justified">
            Whenever you share a part of a dataset with another user, you seamlessly set up a secure communication channel to
            send them the encryption key. Whenever they come online next, they will receive your message and add the key to their
            keystore.
          </p>
        </>
      )
    },
    {
      target: "#sources-intro",
      placementBeacon: "top-end",
      title: "Adding a new data source",
      content: (
        <>
          <p className="has-text-justified">
            You can upload a new dataset now. Please note that only csv files are supported at this moment.
          </p>
        </>
      )
    }
  ]

  return (
    <OnboardingSteps
      name={"onboarding-sources"}
      steps={steps}
    />
  )
}

export default Onboarding
