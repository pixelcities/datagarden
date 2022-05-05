import React, { FC, useEffect } from 'react';
import { Redirect, useHistory } from "react-router-dom";

import { useAuthContext } from 'contexts';


const Logout: FC = () => {
  const { isAuthenticated, handleLogout } = useAuthContext();
  const history = useHistory();

  useEffect(() => {
    if (isAuthenticated) {
      fetch(process.env.REACT_APP_API_BASE_PATH + "/auth/local/logout", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
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
