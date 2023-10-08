import React, { FC, Component, useMemo, useState, useEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'
import { Mutex } from 'async-mutex'

import Navbar from 'components/Navbar'
import Section from 'components/Section'

import { useAppSelector, useAppDispatch } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { rotateKeys } from 'utils/rotate'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'


class KeyStoreRoute extends Component<RouteComponentProps> {
  render() {
    const parentPath = this.props.match.path

    return (
      <div>
        <Navbar />

        <Route path={parentPath + "/rotate"} component={RotateModal} />
        <Route path={parentPath} component={KeyStore} />
      </div>
    )
  }
}

const KeyStore: FC = () => {
  const { keyStore, keyStoreIsReady } = useKeyStoreContext();

  const renderKeys = useMemo(() => {
    if (!keyStoreIsReady) {
      return []
    }

    return keyStore.get_key_ids().map((keyId: string) => {
      return (
        <Key key={keyId} id={keyId} />
      )
    })

  }, [ keyStore, keyStoreIsReady ])


  return (
    <Section>
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-three-fifths">

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              Your secret keys
            </h2>

            <p className="pb-6">
              You can view and export / backup your secret keys here. Note that this will extract and display the secret key
              in plaintext and should be used with care.
            </p>

            { renderKeys }

          </div>
        </div>
      </div>
    </Section>
  )
}

const confirmModal = window.confirm

const Key: FC<{id: string}> = ({ id }) => {
  const { keyStore } = useKeyStoreContext();

  const [value, setValue] = useState(id)
  const [isLocked, setIsLocked] = useState(true)

  const handleClick = () => {
    if (isLocked && confirmModal("Are you sure you want to export this key?")) {
      setValue(keyStore.get_key(id))
      setIsLocked(false)
    } else {
      setValue(id)
      setIsLocked(true)
    }
  }

  return (
    <div className="box columns mt-2" onClick={handleClick} style={{cursor: "pointer"}}>
      <div className="column is-1 has-text-centered py-0 px-0">
        <span className="icon is-small is-left">
          <FontAwesomeIcon icon={isLocked ? faLock : faLockOpen} size="xs"/>
        </span>
      </div>

      <div className="column is-10 py-0 px-0">
        <p className={isLocked ? "has-text-weight-semibold" : ""}> { value } </p>
      </div>
    </div>
  )
}

const RotateModal: FC = () => {
  const dispatch = useAppDispatch()

  const [isActive, setIsActive] = useState(false)

  const mutex = useMemo(() => new Mutex(), [])

  const { user } = useAuthContext()
  const { keyStore, protocol } = useKeyStoreContext()
  const dataSpace = useAppSelector(selectActiveDataSpace)

  useEffect(() => {
    if (!isActive && dataSpace && user && keyStore && protocol && mutex) {
      if (window.confirm("Are you sure you want to rotate all the internal keys?")) {
        setIsActive(true)

        rotateKeys(dataSpace, user, keyStore, protocol, dispatch, mutex)
      } else {
        window.location.href = "/"
      }
    }
  }, [ isActive, dataSpace, user, keyStore, protocol, dispatch, mutex ])

  return (
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-content" style={{width: "33rem"}}>
        { isActive &&
          <div className="box">
            <h2 className="subtitle has-text-centered pb-2">
              Rotating keys
            </h2>

            <div className="spinner" />

            <p className="has-text-centered pt-5">
              Do not close this tab or window.
            </p>
          </div>
        }
      </div>
    </div>
  )
}

export default KeyStoreRoute;
