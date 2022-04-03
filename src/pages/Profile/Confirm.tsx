import React, { FC, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { useHistory } from "react-router-dom";

import { useAuthContext } from 'utils/AuthContext';

// TODO: add rotation token
interface ConfirmProps {
  token: string
}

const Confirm: FC <RouteComponentProps<ConfirmProps>> = (props) => {
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
          "Content-Type": "application/json"
        }
      }).then((response) => {
        // Ensure that everything is in sync
        history.push("/logout")

      }).catch((e) => {
        console.log(e);
      })
    }
  }, [ isAuthenticated, url, token, history ])

  return (
    <></>
  )
}

export default Confirm;
