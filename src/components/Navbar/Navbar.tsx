import React, { FC } from 'react'
import { Link } from 'react-router-dom'

import logo from 'assets/logo-white.svg'

import { useAuthContext } from 'contexts'

import AvatarMenu from 'components/AvatarMenu'
import NotificationsMenu from 'components/NotificationsMenu'


const Navbar: FC = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <nav className="navbar is-primary is-fixed-top" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link className="navbar-item" to="/">
          <img src={logo} alt="logo" width="40" height="35"/>
          <h1 className="header-label label-size-4 is-white pl-2">
            DataGarden <span className="header-label label-size-1 is-white" style={{marginTop: "-1rem"}}><sup>Beta</sup></span>
          </h1>
        </Link>
      </div>

      <div className="navbar-end">
        { isAuthenticated ?
          <>
            <div className="navbar-item">
              <NotificationsMenu />
            </div>
          </>
        :
          <>
            <Link className="navbar-item" to="/pricing">
              <h3 className="is-size-5 px-2">
                Pricing
              </h3>
            </Link>
          </>
        }

        <div className="navbar-item">
          <AvatarMenu />
        </div>


      </div>

    </nav>
  )
}

export default Navbar
