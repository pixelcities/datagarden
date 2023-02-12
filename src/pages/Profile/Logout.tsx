import React, { FC, useEffect } from 'react'
import { Redirect, useHistory } from "react-router-dom"

import { useAuthContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'


const Logout: FC = () => {
  const { isAuthenticated, handleLogout } = useAuthContext();
  const history = useHistory();

  useEffect(() => {
    if (isAuthenticated) {
      // Clear out localStorage, except for the onboarding steps
      let keys = []
      for (let i=0; i < localStorage.length; i++) {
        const key = localStorage.key(i)

        if (key && key.indexOf("onboarding") === -1) {
          keys.push(key)
        }
      }

      for (const key of keys) {
        localStorage.removeItem(key)
      }

      // Logout
      fetch(process.env.REACT_APP_API_BASE_PATH + "/auth/local/logout", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        handleLogout()
        history.push("/")
      }).catch((e) => {
        console.log(e);
      })
    }
  }, [ handleLogout, isAuthenticated, history ])

  return (
    <>
      { ! isAuthenticated ?
        <Redirect to="/" />
      : null }
    </>
  )
}

export default Logout;
