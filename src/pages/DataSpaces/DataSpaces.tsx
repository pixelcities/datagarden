import React, { FC, useEffect, useState, useMemo } from 'react'
import { Route, Switch, Link, useHistory, useParams } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

import PrivateRoute from 'utils/PrivateRoute'

import Contacts from 'pages/Contacts'

import Section from 'components/Section'
import Navbar from 'components/Navbar'
import NotificationsBar from 'components/NotificationsBar'
import Footer from 'components/Footer'
import DSSettings from 'components/DSSettings'
import Onboarding from './Onboarding'

import { DataSpace } from 'types'

import { useAuthContext } from 'contexts'
import { useKeyStoreContext } from 'contexts'
import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace, selectConnectionState, selectIsLoading } from 'state/selectors'
import { leaveDataSpace, setActiveDataSpace } from 'state/actions'

import benchImg from 'assets/bench.png'


const DataSpacesRoute: FC = ({ children }) => {
  return (
    <Switch>
      <PrivateRoute exact path="/" component={DataSpaces} />
      <Route path="/ds/:handle">
        <VerifyHandle>
          { children }
        </VerifyHandle>
      </Route>
    </Switch>
  )
}

const VerifyHandle: FC = ({ children }) => {
  const history = useHistory()
  const { handle } = useParams<{handle: string}>()
  const { keyStore, keyStoreIsReady } = useKeyStoreContext()
  const { isAuthenticated } = useAuthContext()

  const dispatch = useAppDispatch()
  const activeHandle = useAppSelector(selectActiveDataSpace)
  const connectionState = useAppSelector(selectConnectionState)
  const isLoading = useAppSelector(selectIsLoading)

  useEffect(() => {
    if (keyStoreIsReady && activeHandle?.handle !== handle) {
      const data = sessionStorage.getItem("spaces")
      const dataSpaces: DataSpace[] = data ? JSON.parse(data) : []
      const dataSpace = dataSpaces?.find(ds => ds.handle === handle)

      if (dataSpace) {
        if (activeHandle) {
          dispatch(leaveDataSpace())
        }

        dispatch(setActiveDataSpace(dataSpace))

      } else {
        history.push("/")
      }
    }
  }, [ keyStoreIsReady, activeHandle, handle, dispatch, history ])

  if (isAuthenticated && keyStoreIsReady && activeHandle && !keyStore?.has_key(activeHandle.key_id)) {
    if (activeHandle?.handle === "trial") {
      // The trial space key is received almost immediatly. Just "refresh" after a short
      // period.
      setTimeout(() => {
        history.push("/ds/trial")
      }, 1000)
    }

    // When the user does not have the metadata key, show a simple waiting room.
    // The contacts page is hardcoded to work, because the fingerprints should be
    // verifiable beforehand.
    return (
      <Switch>
        <PrivateRoute path="/ds/:handle/contacts" component={Contacts} />
        <Route path="/ds/:handle">
          <WaitingRoom />
        </Route>
      </Switch>
    )
  }

  if (isLoading) {
    return (
      <Switch>
        <Route path="/">
          <div className="pageloader is-bottom-to-top is-active">
            <span className="title">
              Loading...
            </span>
          </div>
        </Route>
      </Switch>
    )
  }

  return (
    <Switch>

      { connectionState !== "connected" && <DisconnectModal state={connectionState} /> }
      { children }
    </Switch>
  )
}


const DataSpaces: FC = (props) => {
  const dispatch = useAppDispatch()

  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>(JSON.parse(sessionStorage.getItem("spaces") || "[]"))
  const [inactiveSpaces, setInactiveSpaces] = useState<DataSpace[]>([])
  const [activeSettings, setActiveSettings] = useState<DataSpace | undefined>()

  const connectionState = useAppSelector(selectConnectionState)

  useEffect(() => {
    dispatch(leaveDataSpace())
  }, [ dispatch ])

  useEffect(() => {
    fetch(process.env.REACT_APP_API_BASE_PATH + "/spaces", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(response)
      } else {
        return response.json()
      }
    }).then(({ active, inactive }) => {
      sessionStorage.setItem("spaces", JSON.stringify(active))
      setDataSpaces(active)
      setInactiveSpaces(inactive)

    }).catch((e) => {
      console.log(e);
    });
  }, [ setDataSpaces ])

  const renderDataSpaces = useMemo(() => {
    return dataSpaces.map((dataSpace) => {
      return (
        <div id={dataSpace.handle === "trial" ? "trial-space" : ""} key={dataSpace.id} className="column is-narrow">

          <Link to={"/ds/" + dataSpace.handle + "/sources"} onClick={() => dispatch(setActiveDataSpace(dataSpace))}>
            <div className="card">
              <div className="card-content px-6 py-6">
                <p className="subtitle">
                  { dataSpace.name || dataSpace.handle }
                </p>
              </div>
            </div>
          </Link>
        </div>
      )
    })
  }, [ dataSpaces, dispatch ])

  const renderInactiveDataSpaces = useMemo(() => {
    return inactiveSpaces.map((dataSpace) => {
      return (
        <div key={dataSpace.id} className="column is-narrow">
          <div className="card">
            <div style={{position: "absolute", top: 0, right: 0, marginTop: -7.5, marginRight: -2.5, zIndex: 1}} onClick={() => setActiveSettings(dataSpace)}>
              <span className="icon is-small has-tooltip-danger" data-tooltip={"Inactive data space. It will automatically be deleted in 30 days."}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="lg" color="#f03158"/>
              </span>
            </div>

            <div className="card-content px-6 py-6">
              <p className="subtitle is-unselectable" style={{color: "#ccc"}}>
                { dataSpace.name || dataSpace.handle }
              </p>
            </div>
          </div>
        </div>
      )
    })
  }, [ inactiveSpaces ])

  return (
    <>
      <Navbar />
      <NotificationsBar />

      { connectionState !== "connected" && <DisconnectModal state={connectionState} /> }

      <Section backdrop={true}>
        { !!activeSettings &&
          <DSSettings
            isActive={!!activeSettings}
            onClose={() => setActiveSettings(undefined)}
            dataSpace={activeSettings}
            role={"owner"}
          />
        }

        <div className="columns is-centered">
          <div className="column is-half">

            <Onboarding />

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              <span id="welcome">
                Data Spaces
              </span>
              <span className="pl-3" data-tooltip={"Create a new data space"}>
                <Link to="/checkout">
                  <div className="button is-small is-info">
                    <span className="icon is-small" >
                      <FontAwesomeIcon icon={faPlus} size="sm"/>
                    </span>
                  </div>
                </Link>
              </span>
            </h2>

            <div className="container pt-7">
              <div className="columns is-multiline is-centered">

                { renderDataSpaces }
                { renderInactiveDataSpaces }

              </div>
            </div>
          </div>
        </div>
      </Section>
      <Footer />
    </>
  )
}

const WaitingRoom: FC = (props) => {
  return (
    <>
      <Navbar />
      <Section>
        <div className="container pt-6">
          <h1 className="title is-size-5 has-text-centered py-5">
            Waiting room
          </h1>

          <div className="has-text-centered">
            <figure className="image is-256x256 is-inline-block">
              <img src={benchImg} alt="" />
            </figure>
          </div>

          <h1 className="subtitle is-size-5 has-text-centered py-5">
            Almost there.. One of your soon to be collaborators can let you in.
          </h1>

        </div>
      </Section>
    </>
  )
}

interface DisconnectModalProps {
  state: string
}

const DisconnectModal: FC<DisconnectModalProps> = ({ state }) => {
  const history = useHistory()
  const [isActive, setIsActive] = useState(false)

  // Only display after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => setIsActive(true), 1500)
    return () => clearTimeout(timeout)
  }, [])

  if (isActive) {
    return (
      <div className="modal is-active">
        <div className="modal-background"/>
        <div className="modal-content">
          <p className="subtitle has-text-centered" style={{color: "#fff"}}>
            { state === "disconnected" && "This account already has another active session." }
            { state === "error" && "No connection to server. Reconnecting.." }
          </p>
          <p className="has-text-centered" style={{color: "#fff"}}>
            { state === "disconnected" && "If you would like this session to become the active one, you can refresh instead." }
          </p>
        </div>

        <div className="modal-footer">
          <div className="fineprint-label label-size-1 is-white is-clickable" onClick={() => history.push("/logout")}>
            Logout
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <></>
    )
  }
}

export default DataSpacesRoute;
