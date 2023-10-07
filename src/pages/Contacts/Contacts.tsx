import React, { FC, Component, useMemo, useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Route } from "react-router-dom";

import { User } from 'types'
import { useAppSelector } from 'hooks'
import { selectUsers } from 'state/selectors'
import { altAsSvg, toColor } from 'utils/helpers'

import Navbar from 'components/Navbar'
import NotificationsBar from 'components/NotificationsBar'
import Section from 'components/Section'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


class ContactsRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path;

  render() {
    return (
      <div>
        <Navbar />
        <NotificationsBar />

        <Route path={this.parentPath} component={Contacts} />
      </div>
    )
  }
}

const Contacts: FC = () => {
  const users = useAppSelector(selectUsers)
  const [fingerprints, setFingerprints] = useState<{[key: string]: string}>({})

  const { user } = useAuthContext()
  const { protocol } = useKeyStoreContext()

  const usersMap: {[key: string]: User} = useMemo(() => {
    return users
      .filter(u => u.id !== user?.id)
      .reduce((a, b) => ({...a, [b.id]: b}), {})
  }, [ user?.id, users ])

  const updateFingerprints = async () => {
    const fingerprints: {[key: string]: string} = {}

    if (user) {
      for (const theirId of Object.keys(usersMap)) {
        const fingerprint = await protocol?.get_fingerprint(user.id, theirId)

        if (fingerprint) {
          fingerprints[theirId] = fingerprint
        }
      }
    }

    setFingerprints(fingerprints)
  }

  useEffect(() => {
    updateFingerprints()

  // eslint-disable-next-line
  }, [ usersMap ])

  const renderContacts = useMemo(() => {

    return Object.entries(fingerprints).map(([id, fingerprint]) => {
      const contact = usersMap[id]
      const displayFingerprint = fingerprint.match(/.{6}/g)?.join(" ") ?? fingerprint

      return (
        <div key={id} className="box columns mt-2">
          <div className="column is-1 has-text-centered">
            <span className="icon is-medium mt-2">
              <img src={contact?.picture || altAsSvg((contact?.name || contact?.email)?.[0]?.toUpperCase())} className={"is-rounded" + (!contact.picture ? " default-icon is-medium bg-" + toColor(contact?.id) : "")} alt={(contact?.name || contact?.email)?.[0]?.toUpperCase()} />
            </span>
          </div>

          <div className="column is-11">
            <p className="has-text-weight-semibold"> {contact?.email} </p>
            <p> {displayFingerprint} </p>
          </div>

        </div>
      )
    })

  }, [ fingerprints, usersMap ])

  return (
    <Section>
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-three-fifths">

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              Verify your collaborators
            </h2>

            <p className="pb-6">
              To verify the security of the end-to-end encryption, you can compare the following safety numbers with each of your collaborators.
              When the numbers match on both ends, you can get a good night's rest knowing that your data is secure.
            </p>

            { renderContacts }

          </div>
        </div>
      </div>
    </Section>
  )
}

export default ContactsRoute;
