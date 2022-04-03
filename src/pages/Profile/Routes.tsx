import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router';
import { Route } from "react-router-dom";

import Navbar from 'components/Navbar';
import Login from './Login'
import Register from './Register'
import Logout from './Logout'
import Profile from './Profile'
import Confirm from './Confirm'

class ProfileRoutes extends Component<RouteComponentProps> {
  parentPath = this.props.match.path

  render() {
    if (this.parentPath === "/login") {
      return (
        <div>
          <Navbar />
          <Route path={this.parentPath} component={Login} />
        </div>
      )

    } else if (this.parentPath === "/register") {
      return (
        <div>
          <Navbar />
          <Route path={this.parentPath} component={Register} />
        </div>
      )

    } else if (this.parentPath === "/logout") {
      return (
        <Route path={this.parentPath} component={Logout} />
      )

    } else if (this.parentPath === "/auth/local/confirm/:token") {
      return (
        <Route path={this.parentPath} component={Confirm} />
      )

    } else if (this.parentPath === "/users/profile/confirm_email/:token") {
      return (
        <Route path={this.parentPath} component={Confirm} />
      )

    } else  {
      return (
        <div>
          <Navbar />
          <Route path={this.parentPath} component={Profile} />
        </div>
      )
    }
  }
}


export default ProfileRoutes;
