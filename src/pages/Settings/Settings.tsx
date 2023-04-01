import React, { FC, Component, useMemo, useState, useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import NotificationsBar from 'components/NotificationsBar'
import HoverButton from 'components/HoverButton'

import { useKeyStoreContext } from 'contexts'
import { useAuthContext } from 'contexts'
import { useAppSelector, useAppDispatch } from 'hooks'
import { UserInvite } from 'types'
import { selectUsers, selectUserInvites, selectActiveDataSpace, selectPages } from 'state/selectors'
import { shareSecret } from 'state/actions'
import { altAsSvg, toColor } from 'utils/helpers'
import { getCSRFToken } from 'utils/getCSRFToken'


class SettingsRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />
        <NotificationsBar />

        <Sidebar page="settings" isMini={false}>
          <Route path={this.parentPath} component={Settings} />
        </Sidebar>
      </div>
    )
  }
}

const Settings: FC = (props) => {
  const users = useAppSelector(selectUsers)
  const userInvites = useAppSelector(selectUserInvites)
  const dataSpace = useAppSelector(selectActiveDataSpace)

  const { user } = useAuthContext()

  const [inviteUserIsActive, setInviteUserIsActive] = useState(false)
  const [confirmUser, setConfirmUser] = useState<UserInvite | undefined>()

  const inviteUserHandler = () => {
    setInviteUserIsActive(true)
  }

  const cancelInvite = useCallback((email: string) => {
    fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${dataSpace.handle}/cancel_invite`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFToken()
      },
      body: JSON.stringify({
        "email": email
      })
    })
  }, [ dataSpace.handle ])

  const renderUsers = useMemo(() => {
    return users.map(u => {
      return (
        <tr key={u.id}>
          <td className="is-narrow">
            <span className="icon is-medium mt-2">
              <img src={u?.picture || altAsSvg((u?.name || u?.email)?.[0]?.toUpperCase())} className={(!u.picture ? " default-icon is-medium bg-" + toColor(u?.id) : "")} alt={(u?.name || u?.email)?.[0]?.toUpperCase()} />
            </span>
          </td>

          <td style={{verticalAlign: "middle"}}>
            {u?.email}
          </td>

          <td style={{verticalAlign: "middle"}}>
            {u.role}
          </td>
          <td style={{verticalAlign: "middle"}}>
            {u.last_active_at}
          </td>
        </tr>
      )
    })
  }, [ users ])

  const renderUserInvites = useMemo(() => {
    return userInvites
      .sort((a, b) => {
        // Sort by date, with NULLs first
        if (!a.id && !b.id) {
          return a.date > b.date ? 1 : -1
        }

        if (!a.id) {
          return 1
        }

        if (!b.id) {
          return -1
        }

        return a.date > b.date ? 1 : -1
      })
      .map(u => {
        return (
          <tr key={u.email}>
            <td className="is-narrow">
              <span className="icon is-medium mt-2">
                { u.id && (
                  <img src={altAsSvg(u?.email[0]?.toUpperCase())} className={"default-icon is-medium bg-" + toColor(u?.id)} alt={u?.email[0]?.toUpperCase()} />
                )}
              </span>
            </td>

            <td style={{verticalAlign: "middle"}}>
              {u?.email}
            </td>

            <td style={{verticalAlign: "middle"}}>
              { u.id ? (<button className="button" onClick={() => setConfirmUser(u)}> Confirm </button>) : "Pending" }
            </td>

            <td className="is-narrow" style={{verticalAlign: "middle"}}>
              <HoverButton type="delete" onClick={() => cancelInvite(u.email)} />
            </td>
          </tr>
        )
      })
  }, [ userInvites, cancelInvite ])

  return (
    <div className="page px-0 pt-0">

      <InviteModal
        isActive={inviteUserIsActive}
        onClose={() => setInviteUserIsActive(false)}
      />

      { confirmUser && (
        <ConfirmModal
          newMember={confirmUser}
          isActive={!!confirmUser}
          onClose={() => setConfirmUser(undefined)}
        />
      )}

      <div className="title">
        Team Management

        { user?.role === "owner" &&
          <button className="button is-success is-outlined is-pulled-right" onClick={inviteUserHandler}> Invite new members </button>
        }

        <div className="border" />
      </div>

      <div className="main px-4">
        <h2 className="header-label label-size-5 pb-3">
          Team Members
        </h2>

        <div className="px-3">
          <table className="table is-striped is-hoverable is-fullwidth">
            <thead>
              <tr>
                <th className="is-narrow"></th>
                <th><span className="header-label label-size-2">Email</span></th>
                <th><span className="header-label label-size-2">Role</span></th>
                <th><span className="header-label label-size-2">Last activity</span></th>
              </tr>
            </thead>

            <tbody>
              { renderUsers }
            </tbody>
          </table>
        </div>

        <br /><br /><br />

        <h2 className="header-label label-size-5 pb-3">
          Open invitations
        </h2>

        <div className="px-3">
          <table className="table is-striped is-hoverable is-fullwidth">
            <thead>
              <tr>
                <th className="is-narrow" style={{minWidth: 56}}></th>
                <th><span className="header-label label-size-2">Email</span></th>
                <th><span className="header-label label-size-2">Status</span></th>
                <th className="is-narrow" style={{minWidth: 56}}></th>
              </tr>
            </thead>

            <tbody>
              { renderUserInvites }
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

interface InviteModalProps {
  isActive: boolean,
  onClose: () => void
}

const InviteModal: FC<InviteModalProps> = ({ isActive, onClose }) => {
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${dataSpace.handle}/invite`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFToken()
      },
      body: JSON.stringify({
        "recipient": email
      })
    }).then((response) => {
      setEmail("")
      onClose()
    }).catch((e) => {
      console.log(e)
    })
  }

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">

            <form onSubmit={handleSubmit}>

            <div className="field pb-0 pt-5">
              <label id="publish" className="label pb-2"> Email </label>

              <div className="control is-fullwidth">
                <input className="input py-0" type="email" placeholder={email} value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}/>
              </div>
            </div>

              <div className="field is-grouped is-grouped-right pt-0">
                <div className="control">
                  <input type="submit" className="button is-primary" value="Invite collaborator" />
                </div>
              </div>
            </form>

          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
      </div>
    </>
  )
}

interface ConfirmModalProps {
  newMember: UserInvite,
  isActive: boolean,
  onClose: () => void
}

const ConfirmModal: FC<ConfirmModalProps> = ({ newMember, isActive, onClose }) => {
  const dispatch = useAppDispatch()
  const dataSpace = useAppSelector(selectActiveDataSpace)
  const pages = useAppSelector(selectPages)

  const { user } = useAuthContext()
  const { keyStore, protocol, keyStoreIsReady } = useKeyStoreContext()

  const [fingerprint, setFingerprint] = useState<string | undefined>()

  useEffect(() => {
    if (!fingerprint && user && newMember.id && newMember.id !== "" && keyStoreIsReady) {
      protocol?.get_fingerprint(user.id, newMember.id).then((fp: string | undefined) => {
        if (!fp) {
          protocol?.encrypt(newMember.id, "hello").then((secret: string) => {
            dispatch(shareSecret({
              key_id: user.id,
              owner: user.id,
              receiver: newMember.id!,
              ciphertext: secret
            }))

            protocol?.get_fingerprint(user.id, newMember.id).then((fp: string | undefined) => {
              setFingerprint(fp?.match(/.{6}/g)?.join(" ") ?? fp)
            })
          })

        } else {
          setFingerprint(fp.match(/.{6}/g)?.join(" ") ?? fp)
        }
      })
    }
  }, [ user, newMember, fingerprint, dispatch, protocol, keyStoreIsReady ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newMember.id && dataSpace?.key_id && user) {
      const secret: string = await protocol?.encrypt(newMember.id, keyStore?.get_key(dataSpace.key_id))

      dispatch(shareSecret({
        key_id: dataSpace.key_id,
        owner: user.id,
        receiver: newMember.id,
        ciphertext: secret
      }))

      // Also share internal page keys, if any
      for (const page of pages) {
        if (page.access.filter(x => x.type === "internal").length > 0 && page.key_id) {
          const secret: string = await protocol?.encrypt(newMember.id, keyStore?.get_key(page.key_id))

          dispatch(shareSecret({
            key_id: page.key_id,
            owner: user.id,
            receiver: newMember.id,
            ciphertext: secret
          }))
        }
      }

      await fetch(process.env.REACT_APP_API_BASE_PATH + `/spaces/${dataSpace.handle}/confirm_member`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCSRFToken()
        },
        body: JSON.stringify({
          "member": newMember.id
        })
      })

      onClose()
    }
  }

  return (
    <>
      <div className={"modal " + (isActive ? "is-active" : "")}>
        <div className="modal-background"></div>
        <div className="modal-content" style={{width: "41rem"}}>
          <div className="box">

            { fingerprint && (
              <form onSubmit={handleSubmit}>
                <div className="field pb-0 pt-5">
                  <h2 className="subtitle has-text-weight-semibold"> Confirm new member </h2>
                  <p>
                    Verify that the fingerprint on your screen matches the one your new member can
                    find in the Contacts page.
                  </p>

                  <div className="divider" />

                  <div className="block">
                    <p className="has-text-weight-semibold"> {newMember.email} </p>
                    <p> { fingerprint } </p>
                  </div>

                  <div className="divider" />
                </div>

                <div className="field is-grouped is-grouped-right pt-0">
                  <div className="control buttons">
                    <div className="button" onClick={onClose}>Cancel</div>
                    <input type="submit" className="button is-primary" value="Confirm" />
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>

         <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
      </div>
    </>
  )
}


export default SettingsRoute;
