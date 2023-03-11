import React, { FC, Component, useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import NotificationsBar from 'components/NotificationsBar'

import { useAppSelector } from 'hooks'
import { selectUsers } from 'state/selectors'
import { altAsSvg, toColor } from 'utils/helpers'


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

  const renderUsers = useMemo(() => {
    return users.map(u => {
      return (
        <tr key={u.id}>
          <td className="is-narrow">
            <span className="icon is-medium mt-2">
              <img src={u?.picture || altAsSvg(u?.email[0]?.toUpperCase())} className={(!u.picture ? " default-icon is-medium bg-" + toColor(u?.id) : "")} alt={u?.email[0]?.toUpperCase()} />
            </span>
          </td>

          <td style={{verticalAlign: "middle"}}>
            {u?.email}
          </td>

          <td />
          <td />
        </tr>
      )
    })
  }, [ users ])

  return (
    <div className="page px-0 pt-0">
      <div className="title">
        Team Management

        <button className="button is-success is-outlined is-pulled-right"> Invite new members </button>

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
                <th><span className="header-label label-size-2">Role</span></th>
                <th><span className="header-label label-size-2">Last activity</span></th>
              </tr>
            </thead>

            <tbody>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default SettingsRoute;
