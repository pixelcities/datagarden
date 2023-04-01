import React, { FC, useEffect } from 'react'
import { Route, Switch } from "react-router-dom"

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { leaveDataSpace } from 'state/actions'

import Navbar from 'components/Navbar'
import Footer from 'components/Footer'

import Login from './Login'
import Register from './Register'
import Logout from './Logout'
import Profile from './Profile'
import ConfirmRegistration from './ConfirmRegistration'
import ConfirmChange from './ConfirmChange'
import ConfirmInvite from './ConfirmInvite'


const ProfileRoutes: FC = ({ children }) => {
  return (
    <Switch>
      <Route path="/login">
        <>
          <Navbar />
          <Login />
          <Footer />
        </>
      </Route>

      <Route path="/register">
        <>
          <Navbar />
          <Register />
          <Footer />
        </>
      </Route>

      <Route path="/logout" component={Logout} />
      <Route path="/auth/local/confirm/:token" component={ConfirmRegistration} />
      <Route path="/users/profile/confirm_email/:token/:rotation_token" component={ConfirmChange} />
      <Route path="/spaces/accept_invite/:token" component={ConfirmInvite} />
      <Route path="/" component={RenderProfile} />
    </Switch>
  )
}

const RenderProfile: FC = ({ children }) => {
  const dispatch = useAppDispatch()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  // Leave any dataSpace before rendering the profile settings
  useEffect(() => {
    if (dataSpace) {
      dispatch(leaveDataSpace())
    }
  }, [ dataSpace, dispatch ])

  if (!dataSpace) {
    return (
      <>
        <Navbar />
        <Profile />
      </>
    )
  }

  return (
    <></>
  )
}


export default ProfileRoutes;
