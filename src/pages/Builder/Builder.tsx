import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import InfinityBoard from 'components/InfinityBoard'
import Navbar from 'components/Navbar'
import NotificationsBar from 'components/NotificationsBar'
import ControlPanel from 'components/ControlPanel'
import Sidebar from 'components/Sidebar'
import Onboarding from './Onboarding'

import './Builder.sass'

class BuilderRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path;

  render() {
    return (
      <div>
        <Navbar />
        <NotificationsBar />
        <Onboarding />

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
          <div className="column-2 ib-container">
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
