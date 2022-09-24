import React, { FC } from 'react'

import OnboardingSteps from 'components/OnboardingSteps'


const Onboarding: FC = () => {
  const steps = [
    {
      target: "#builder-intro",
      placementBeacon: "top",
      title: "Welcome to the Pipeline Builder",
      content: (
        <>
          <p className="has-text-justified">
            DataGarden allows you to create each step of your data workflow visually.

            Multiple collaborators may work on the canvas simultaneously: everything is synced in real time.
          </p>
        </>
      )
    },
    {
      target: "#collection-intro",
      placementBeacon: "top",
      title: "Using published sources",
      content: (
        <>
          <p className="has-text-justified">
            If any sources are published and shared with you, they show up here.
          </p>
          <br />
          <p className="has-text-justified">
            Drag and drop the source onto the canvas to start a workflow.
          </p>
        </>
      )
    },
    {
      target: "#workspace-intro",
      placementBeacon: "top",
      title: "Workspaces tab",
      content: (
        <>
          <p className="has-text-justified">
            Add functions to operate on the data in the workspaces tab.
          </p>
          <br />
          <p className="has-text-justified">
            Functions are also dragged onto the canvas, after which you connect a data source to them.
            After configuring and running the function, it will produce a new dataset and you are well on
            your way into building a proper workflow!
          </p>
        </>
      )
    }
  ]

  return (
    <OnboardingSteps
      name={"onboarding-builder"}
      steps={steps}
    />
  )
}

export default Onboarding
