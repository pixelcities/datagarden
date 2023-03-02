import React, { FC, useState, useEffect } from 'react'
import { useHistory, Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'

import Section from 'components/Section'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { genCSRFToken } from 'utils/getCSRFToken'

const Login: FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const { isAuthenticated, handleLogin, path } = useAuthContext();
  const { keyStore, protocol, __setIsReady__ } = useKeyStoreContext();

  const history = useHistory();

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const hashedPassword = keyStore.open_sesame(email, password)

    fetch(process.env.REACT_APP_API_BASE_PATH + "/auth/local/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": genCSRFToken()
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
      keyStore?.init().then(() => {
        const secret_key = keyStore?.get_named_key("protocol")
        protocol?.init(secret_key).then(() => {
          __setIsReady__(true)
        })
      })

      history.push(path)
    }).catch((e) => {
      setError(true)
      console.log(e);
    });

    setEmail("")
    setPassword("")
  }

  useEffect(() => {
    if (isAuthenticated) {
      history.push("/")
    }
  }, [ history, isAuthenticated ])

  return (
    <Section backdrop={true}>
      <div className="container">

        { error ?
          <article className="message is-danger">
            <div className="message-header">
              <p>Invalid email or password</p>
              <button className="delete" aria-label="delete" onClick={() => setError(false)} />
            </div>
          </article>
        : null }

        { !isAuthenticated ?
          <>
            <p className="subtitle pt-3 is-size-5 has-text-centered is-italic">
              Login to your account.
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
                        <input type="submit" className="button is-primary" value="Login" />
                      </p>
                    </div>
                  </form>

                </div>
              </div>
            </div>

            <p className="subtitle pt-5 is-size-6 has-text-centered is-italic">
              Don't have an account? <span style={{textDecorationLine: "underline", textDecorationStyle: "solid"}}><Link to="/register"> Register here </Link></span>
            </p>

          </>
        : null }

      </div>
    </Section>
  )
}

export default Login;
