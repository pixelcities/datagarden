import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Footer from 'components/Footer'

import Login from './Login'
import Register from './Register'
import Logout from './Logout'
import Profile from './Profile'
import Confirm from './Confirm'

class ProfileRoutes extends Component<RouteComponentProps> {
  render() {
    const parentPath = this.props.match.path

    if (parentPath === "/login") {
      return (
        <div>
          <Navbar />
          <Route path={parentPath} component={Login} />
          <Footer />
        </div>
      )

    } else if (parentPath === "/register") {
      return (
        <div>
          <Navbar />
          <Route path={parentPath} component={Register} />
          <Footer />
        </div>
      )

    } else if (parentPath === "/logout") {
      return (
        <Route path={parentPath} component={Logout} />
      )

    } else if (parentPath === "/auth/local/confirm/:token") {
      return (
        <Route path={parentPath} component={Confirm} />
      )

    } else if (parentPath === "/users/profile/confirm_email/:token") {
      return (
        <Route path={parentPath} component={Confirm} />
      )

    } else  {
      return (
        <div>
          <Navbar />
          <Route path={parentPath} component={Profile} />
        </div>
      )
    }
  }
}


export default ProfileRoutes;
