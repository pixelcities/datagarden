import React, { FC } from 'react'

import OnboardingSteps from 'components/OnboardingSteps'


const Onboarding: FC = () => {
  const steps = [
    {
      target: "#data-intro",
      placementBeacon: "top",
      title: "Viewing data",
      content: (
        <>
          <p className="has-text-justified">
            Datasets are immutable in DataGarden. You instead add functions in the pipeline builder that operate on the datasets.
            Instead, the data viewer allows you to inspect (intermediary) data, and share any columns with other users that need access.
          </p>
          <br />
          <p className="has-text-justified">
            You share data on a column by column basis. After granting a user access to the dataset they by default can only
            read the title and column names, but not any of the data. Sharing a column is achieved by clicking on a header and adding the
            user with a quick drag and drop.
          </p>
        </>
      )
    },
    {
      target: "#share-intro",
      placementBeacon: "top",
      title: "Sharing data",
      content: (
        <>
          <p className="has-text-justified">
            As an example, you may share this dataset with a user called <span className="is-italic"> alice@pixelcities.io </span>.
          </p>
          <br />
          <p className="has-text-justified">
            Next, you can share individual columns by clicking on the column header and granting her access.
          </p>
        </>
      )
    },
    {
      target: "#publish",
      placementBeacon: "top-start",
      title: "Publishing data",
      content: (
        <>
          <p className="has-text-justified">
            Finally, you publish a data source so that is available in the pipeline builder.
          </p>
          <br />
          <p className="has-text-justified">
            When published, you can safely close this modal and headover to the <span className="has-text-weight-bold"> Pipeline Builder </span>
          </p>
        </>
      )
    }
  ]

  return (
    <OnboardingSteps
      name={"onboarding-sourcetable"}
      steps={steps}
    />
  )
}

export default Onboarding
