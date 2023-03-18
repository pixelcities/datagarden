import React, { FC, useState } from 'react'
import { useHistory } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'

import Section from 'components/Section'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { genCSRFToken } from 'utils/getCSRFToken'

const Register: FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmPrompt, setConfirmPrompt] = useState(false)
  const [error, setError] = useState("")

  const { isAuthenticated, handleLogin, path } = useAuthContext()
  const { keyStore, protocol, __setIsReady__ } = useKeyStoreContext()

  const history = useHistory()

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const hashedPassword = keyStore.open_sesame(email, password)

    let userBody: {[key: string]: string} = {
      "email": email,
      "password": hashedPassword,
      "remember_me": "true"
    }

    if (path) {
      const match = path.match(/accept_invite\/([a-zA-Z0-9_-]+)/)

      if (match?.length === 2) {
        userBody.invite = match[1]
      }
    }

    fetch(process.env.REACT_APP_API_BASE_PATH + "/auth/local/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": genCSRFToken()
      },
      body: JSON.stringify({
        "user": userBody
      })
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(response)
      } else {
        return response.json()
      }
    }).then((data) => {
      if (!userBody.invite) {
        setConfirmPrompt(true)
      }

      // Ensure we start fresh
      localStorage.clear()

      keyStore.create_named_key("protocol", 32).then((key_id: string) => {
        protocol.register(keyStore.get_key(key_id)).then((pub_key: string) => {
          handleLogin(data)
          keyStore.init().then(() => {
            __setIsReady__(true)

            if (userBody.invite) {
              history.push("/")
            }
          })
        })
      })
    }).catch((e) => {
      console.log(e);
    });

    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <Section backdrop={true}>
      <div className="container">

        { error !== "" &&
          <article className="message is-danger">
            <div className="message-header">
              <p>{ error }</p>
              <button className="delete" aria-label="delete" onClick={() => setError("")} />
            </div>
          </article>
        }

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
                    <div className="field">
                      <p className="control has-icons-left">
                        <input className="input" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
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

        { confirmPrompt ?
          <>
            <p className="subtitle pt-3 is-size-5 has-text-centered is-italic">
              An email has been sent to confirm your account.
            </p>
          </>
        : null }

      </div>
    </Section>
  )
}

export default Register;
