import React, { FC, useState } from 'react';
import { useHistory } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'

import Section from 'components/Section';

import { useAuthContext } from 'contexts';
import { useKeyStoreContext } from 'contexts';

const Register: FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { isAuthenticated, handleLogin, path } = useAuthContext();
  const { keyStore } = useKeyStoreContext();

  const history = useHistory();

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const hashedPassword = keyStore.open_sesame(email, password)

    fetch(process.env.REACT_APP_API_BASE_PATH + "/auth/local/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "user": {
          "email": email,
          "password": hashedPassword,
          "remember_me": "true"
        },
      })
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(response)
      } else {
        return response.json()
      }
    }).then((data) => {
      handleLogin(data)
      keyStore.init()
      history.push(path)
    }).catch((e) => {
      console.log(e);
    });

    setEmail("")
    setPassword("")
  }

  return (
    <Section>
      <div className="container">

        { !isAuthenticated ?
          <>
            <p className="subtitle pt-3 is-size-5 has-text-centered is-italic">
              Create an account
            </p>

            <br /><br />

            <div className="columns is-centered">
              <div className="column is-half">
                <div className="box">
                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <p className="control has-icons-left has-icons-right">
                        <input className="input" type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                        <span className="icon is-small is-left">
                          <FontAwesomeIcon icon={faEnvelope} size="xs"/>
                        </span>
                      </p>
                    </div>
                    <div className="field">
                      <p className="control has-icons-left">
                        <input className="input" type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                        <span className="icon is-small is-left">
                          <FontAwesomeIcon icon={faLock} size="xs"/>
                        </span>
                      </p>
                    </div>
                    <div className="field is-grouped is-grouped-right">
                      <p className="control">
                        <input type="submit" className="button is-primary" value="Register" />
                      </p>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          </>
        : null }

      </div>
    </Section>
  )
}

export default Register;
