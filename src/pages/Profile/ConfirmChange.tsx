import React, { FC, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { useHistory } from "react-router-dom"

import { useAuthContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'

interface ConfirmChangeProps {
  token: string,
  rotation_token: string
}

const ConfirmChange: FC <RouteComponentProps<ConfirmChangeProps>> = (props) => {
  const url = props.match.url
  const params = props.match.params
  const token = params?.token
  const rotationToken = params?.rotation_token

  const { isAuthenticated } = useAuthContext();
  const history = useHistory();

  useEffect(() => {
    if (isAuthenticated && token && rotationToken) {
      fetch(process.env.REACT_APP_API_BASE_PATH + url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {
        // Ensure that everything is in sync
        history.push("/logout")

      }).catch((e) => {
        console.log(e);
      })
    }
  }, [ isAuthenticated, url, token, rotationToken, history ])

  return (
    <></>
  )
}

export default ConfirmChange;
