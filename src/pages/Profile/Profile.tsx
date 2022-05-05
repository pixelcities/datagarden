import React, { FC, useState } from 'react';
import { useHistory } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'

import Section from 'components/Section';

import { useAuthContext } from 'contexts';
import { useKeyStoreContext } from 'contexts';


const Profile: FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();
  const { keyStore } = useKeyStoreContext();

  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [confirmEmailPassword, setConfirmEmailPassword] = useState("")
  const [name, setName] = useState(user?.name || "")
  const [fileName, setFileName] = useState("")
  const [picture, setPicture] = useState<string | undefined>(undefined)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const notify = (message: string) => {
    setInfo(message)
    window.scrollTo(0, 0)
  }

  const loadPicture = (e: any) => {
    const f = e.target.files[0]
    const name = f.name
    setFileName(name)

    if ( /\.(jpe?g|png|svg)$/i.test(name) ) {
      const reader = new FileReader()
      reader.onloadend = (ev) => {
        const result = ev?.target?.result

        if ( typeof(result) === "string") {
          // Verify length (and don't bother with padding)
          const base = "data:image/svg+xml;base64,".length
          const fileSize = (result.length - base) / 4 * 3

          if (fileSize > 256000) {
            setError("Image size cannot be larger than 256kb")
            return
          }

          setPicture(result)
        }
      }
      reader.readAsDataURL(f)
    }
  }

  const handleUpdateEmail = (e: any) => {
    e.preventDefault()

    const hashedPassphrase = keyStore.get_hashed_passphrase(user?.email, confirmEmailPassword)

    keyStore.rotate_keys(email, confirmEmailPassword).then((rotation: any) => {
      fetch(process.env.REACT_APP_API_BASE_PATH + "/users/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "action": "update_email",
          "current_password": hashedPassphrase,
          "user": {
            "email": email
          },
          "rotation_token": rotation.token
        })
      }).then((response) => {
        notify("Email updated successfully. A link to confirm your email change has been sent to the new address")
      }).catch((e) => {
        console.log(e);
      })
    })
  }

  const handleUpdatePassword = (e: any) => {
    e.preventDefault()

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match")
      return
    }

    const hashedPassphrase = keyStore.get_hashed_passphrase(user?.email, currentPassword)

    keyStore.rotate_keys(user?.email, newPassword).then((rotation: any) => {
      fetch(process.env.REACT_APP_API_BASE_PATH + "/users/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "action": "update_password",
          "current_password": hashedPassphrase,
          "user": {
            "password": rotation.hashed_passphrase
          },
          "rotation_token": rotation.token
        })
      }).then((response) => {
        notify("Password updated successfully")

        setTimeout(() => history.push("/logout"), 1500)
      }).catch((e) => {
        console.log(e);
      })
    })
  }

  const handleUpdateProfile = (e: any) => {
    e.preventDefault()

    fetch(process.env.REACT_APP_API_BASE_PATH + "/users/profile", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "action": "update_profile",
        "user": {
          "name": name,
          "picture": picture
        }
      })
    }).then((response) => {
      notify("Profile updated successfully")
    }).catch((e) => {
      console.log(e);
    })
  }

  return (
    <Section>
      <div className="container">

        { (error !== "") ?
          <article className="message is-danger">
            <div className="message-header">
              <p>{ error }</p>
              <button className="delete" aria-label="delete" onClick={() => setError("")} />
            </div>
          </article>
        : null }

        { (info !== "") ?
          <article className="message is-info">
            <div className="message-header">
              <p>{ info }</p>
              <button className="delete" aria-label="delete" onClick={() => setInfo("")} />
            </div>
          </article>
        : null }

        <div className="columns is-centered">
          <div className="column is-half">

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              Update your profile
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="box">
                <div className="field">
                  <label className="label">Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder={user?.name} value={name} onChange={(e: any) => setName(e.target.value)} />
                  </div>
                </div>

                <div className="field-body">
                  <div className="field">
                    <label className="label">Picture</label>

                    <div className="file has-name is-fullwidth">
                      <label className="file-label">
                        <input className="file-input" type="file" name="picture" accept=".jpg,.jpeg,.png,.svg" onChange={loadPicture} />
                        <span className="file-cta">
                          <span className="file-icon">
                            <FontAwesomeIcon icon={faUpload} size="xs"/>
                          </span>
                          <span className="file-label">
                            Choose a file…
                          </span>
                        </span>
                        <span className="file-name">
                          { fileName }
                        </span>
                    </label>
                    </div>
                  </div>

                  { picture ?
                    <div className="field">
                      <div className="columns is-centered">
                        <div className="column is-narrow">
                          <label className="label">Preview</label>
                          <figure className="image is-48x48">
                            <img className="is-rounded" src={picture} alt="avatar" width="40" height="35" />
                          </figure>
                        </div>
                      </div>

                    </div>
                : null }
                </div>

                <p className="help">Max size 256kb</p>

                <div className="field is-grouped is-grouped-right">
                  <div className="control">
                    <input type="submit" className="button is-primary" value="Update profile" />
                  </div>
                </div>
              </div>
            </form>

            <h2 className="subtitle pt-7 is-size-4 has-text-centered">
              Update email
            </h2>
            <form onSubmit={handleUpdateEmail}>
              <div className="box">
                <div className="field">
                  <label className="label">Current Password</label>
                  <div className="field">
                    <p className="control has-icons-left">
                      <input className="input" type="password" placeholder="************" value={confirmEmailPassword} onChange={(e: any) => setConfirmEmailPassword(e.target.value)} />
                      <span className="icon is-small is-left">
                        <FontAwesomeIcon icon={faLock} size="xs"/>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label className="label">New Email</label>
                  <p className="control has-icons-left has-icons-right">
                    <input className="input" type="email" placeholder={user?.email} value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    <span className="icon is-small is-left">
                      <FontAwesomeIcon icon={faEnvelope} size="xs"/>
                    </span>
                  </p>
                </div>

                <div className="field is-grouped is-grouped-right">
                  <div className="control">
                    <input type="submit" className="button is-primary" value="Change email" />
                  </div>
                </div>
              </div>
            </form>

            <h2 className="subtitle pt-7 is-size-4 has-text-centered">
              Update password
            </h2>
            <form onSubmit={handleUpdatePassword}>
              <div className="box">
                <div className="field">
                  <label className="label">Current Password</label>
                  <div className="field">
                    <p className="control has-icons-left">
                      <input className="input" type="password" placeholder="************" value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)} />
                      <span className="icon is-small is-left">
                        <FontAwesomeIcon icon={faLock} size="xs"/>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label className="label">New Password</label>
                  <div className="field">
                    <p className="control has-icons-left">
                      <input className="input" type="password" placeholder="************" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} />
                      <span className="icon is-small is-left">
                        <FontAwesomeIcon icon={faLock} size="xs"/>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Confirm New Password</label>
                  <div className="field">
                    <p className="control has-icons-left">
                      <input className="input" type="password" placeholder="************" value={confirmNewPassword} onChange={(e: any) => setConfirmNewPassword(e.target.value)} />
                      <span className="icon is-small is-left">
                        <FontAwesomeIcon icon={faLock} size="xs"/>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="field is-grouped is-grouped-right">
                  <div className="control">
                    <input type="submit" className="button is-primary" value="Change password" />
                  </div>
                </div>
              </div>
            </form>

          </div>
        </div>

      </div>
    </Section>
  )
}

export default Profile;
