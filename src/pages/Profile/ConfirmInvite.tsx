import React, { FC, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { useHistory } from "react-router-dom"

import { useAuthContext } from 'contexts'
import { getCSRFToken } from 'utils/getCSRFToken'

interface ConfirmInviteProps {
  token: string
}

const ConfirmInvite: FC <RouteComponentProps<ConfirmInviteProps>> = (props) => {
  const url = props.match.url
  const params = props.match.params
  const token = params?.token

  const { isAuthenticated } = useAuthContext();
  const history = useHistory();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(process.env.REACT_APP_API_BASE_PATH + url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        }
      }).then((response) => {

      }).catch((e) => {
        console.log(e);
      })
    }
  }, [ isAuthenticated, url, token, history ])

  return (
    <></>
  )
}

export default ConfirmInvite;
