import React, { FC, useEffect, useState, useMemo } from 'react'
import { Route, Switch, Link, useHistory, useParams } from "react-router-dom"
import PrivateRoute from 'utils/PrivateRoute'

import Contacts from 'pages/Contacts'

import Section from 'components/Section'
import Navbar from 'components/Navbar'
import Onboarding from './Onboarding'

import { DataSpace } from 'types'

import { useKeyStoreContext } from 'contexts'
import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { leaveDataSpace, setActiveDataSpace } from 'state/actions'

import benchImg from 'assets/bench.png'


const DataSpacesRoute: FC = ({ children }) => {
  return (
    <Switch>
      <PrivateRoute exact path="/" component={DataSpaces} />
      <Route path="/:handle">
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

  const dispatch = useAppDispatch()
  const activeHandle = useAppSelector(selectActiveDataSpace)

  useEffect(() => {
    if (activeHandle?.handle !== handle) {
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
  }, [ activeHandle, handle, dispatch, history ])

  if (keyStoreIsReady && !keyStore?.has_key(activeHandle.key_id)) {
    if (activeHandle?.handle === "trial") {
      // The trial space key is received almost immediatly. Just "refresh" after a short
      // period.
      setTimeout(() => {
        history.push("/trial")
      }, 1000)
    }

    // When the user does not have the metadata key, show a simple waiting room.
    // The contacts page is hardcoded to work, because the fingerprints should be
    // verifiable beforehand.
    return (
      <Switch>
        <PrivateRoute path="/:handle/contacts" component={Contacts} />
        <Route path="/:handle">
          <WaitingRoom />
        </Route>
      </Switch>
    )
  }

  return (
    <Switch>
      { children }
    </Switch>
  )
}


const DataSpaces: FC = (props) => {
  const dispatch = useAppDispatch()

  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>([])

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
    }).then((data) => {
      sessionStorage.setItem("spaces", JSON.stringify(data))
      setDataSpaces(data)

    }).catch((e) => {
      console.log(e);
    });
  }, [ setDataSpaces ])

  const renderDataSpaces = useMemo(() => {
    return dataSpaces.map((dataSpace) => {
      return (
        <div id={dataSpace.handle === "trial" ? "trial-space" : ""} key={dataSpace.id} className="column is-narrow">

          <Link to={"/" + dataSpace.handle + "/sources"} onClick={() => dispatch(setActiveDataSpace(dataSpace))}>
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


  return (
    <>
      <Navbar />
      <Section>
        <div className="columns is-centered">
          <div className="column is-half">

            <Onboarding />

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              <span id="welcome">
                Choose a Data Space
              </span>
            </h2>

            <div className="container pt-7">
              <div className="columns is-multiline is-centered">

                { renderDataSpaces }

              </div>
            </div>
          </div>
        </div>
      </Section>
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


export default DataSpacesRoute;
