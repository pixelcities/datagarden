import React, { FC } from 'react'

import OnboardingSteps from 'components/OnboardingSteps'


const Onboarding: FC = () => {
  const steps = [
    {
      target: "#query-intro",
      placementBeacon: "auto",
      content: (
        <>
          <p className="has-text-justified">
            This is the advanced query builder. While not user friendly is supports most SQL statements, which means
            anything is possible!
          </p>
          <br />
          <p className="has-text-justified">
            If familiar with SQL, you may write any statement but be sure to replace the table and column identifiers with references. You can add
            new columns by clicking the plus icon next to the identifiers overview.
          </p>
          <br />
          <p className="has-text-justified">
            If not familiar, or if you are happy with the results: nothing is final until you click <span className="has-text-weight-bold"> commit</span>.
            When commiting the results, they are computed in the background and the new dataset is created. Have fun!
          </p>.
        </>
      )
    }
  ]

  return (
    <OnboardingSteps
      name={"onboarding-customtransformer"}
      steps={steps}
    />
  )
}

export default Onboarding
