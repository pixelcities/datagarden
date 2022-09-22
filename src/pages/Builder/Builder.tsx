import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"
import Joyride, { Placement } from 'react-joyride'

import InfinityBoard from 'components/InfinityBoard'
import Navbar from 'components/Navbar'
import ControlPanel from 'components/ControlPanel'
import Sidebar from 'components/Sidebar'

import './Builder.sass'

const tour = [
  {
    target: "#builder-intro",
    placementBeacon: "top" as Placement,
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
    placementBeacon: "top" as Placement,
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
    placementBeacon: "top" as Placement,
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

class BuilderRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path;

  render() {
    return (
      <div>
        <Navbar />

        <Joyride
          steps={tour}
          styles={{
            options: {
              primaryColor: "#e49bcf"
            }
          }}
          continuous={true}
        />

        <Sidebar page="builder" isMini={true}>
          <Route path={this.parentPath} component={Builder} />
        </Sidebar>
      </div>
    )
  }
}


class Builder extends Component {
  render() {
    return (
      <div className="px-0 pt-0">
        <div className="columns is-gapless">
          <div className="column is-2">
            <ControlPanel />
          </div>

          <div className="column is-10 ib-container">
            <InfinityBoard />

          </div>
        </div>
      </div>
    );
  }
}

export default BuilderRoute;
