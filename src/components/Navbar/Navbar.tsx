import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import logo from 'assets/logo-white.svg'
import notifications from 'assets/notifications.svg'
import help from 'assets/help.svg'
import search from 'assets/search.svg'

import AvatarMenu from 'components/AvatarMenu'

class Navbar extends Component {
  render() {
    return (
      <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">
            <img src={logo} alt="logo" width="40" height="35"/>
            <h1 className="header-label label-size-4 is-white pl-2">
              DataGarden
            </h1>
          </Link>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <img src={search} alt="search" width="20" height="20"/>
          </div>

          <div className="navbar-item">
            <img src={help} alt="help" width="20" height="20"/>
          </div>

          <div className="navbar-item">
            <img src={notifications} alt="notifications" width="20" height="20"/>
          </div>

          <div className="navbar-item">
            <AvatarMenu />
          </div>


        </div>

      </nav>
    )
  }
}

export default Navbar
