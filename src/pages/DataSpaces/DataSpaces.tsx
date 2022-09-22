import React, { FC, useEffect, useState, useMemo } from 'react'
import { Route, Redirect, Switch, Link, useParams } from "react-router-dom"
import Joyride, { Placement } from 'react-joyride'
import PrivateRoute from 'utils/PrivateRoute'

import Section from 'components/Section'
import Navbar from 'components/Navbar'

import { DataSpace } from 'types'

import { useKeyStoreContext } from 'contexts'
import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { leaveDataSpace, setActiveDataSpace } from 'state/actions'


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
  const { handle } = useParams<{handle: string}>()

  const activeHandle = useAppSelector(selectActiveDataSpace)

  if (activeHandle?.handle === handle) {
    return (
      <Switch>
        { children }
      </Switch>
    )

  } else {
    return (
      <Redirect to="/" />
    )
  }
}


const DataSpaces: FC = (props) => {
  const dispatch = useAppDispatch()

  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>([])
  const { keyStoreIsReady } = useKeyStoreContext()

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
      setDataSpaces(data)

    }).catch((e) => {
      console.log(e);
    });
  }, [ setDataSpaces ])

  const renderDataSpaces = useMemo(() => {
    return dataSpaces.map((dataSpace) => {
      return (
        <div id={dataSpace.handle === "ds1" ? "trial-space" : ""} key={dataSpace.id} className="column is-narrow">

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

  const steps = [
    {
      target: "#welcome",
      // placement: "top-end" as Placement,
      placementBeacon: "top-end" as Placement,
      title: "Welcome to DataGarden",
      content: (
        <>
          <p className="has-text-justified">
            DataGarden is an end-to-end encrypted data collaboration platform.

            Everyone works together in <span className="has-text-weight-bold"> Data Spaces </span>, where you invite
            other users and organisations to collaborate together, in a secure and private manner.
          </p>
        </>
      )
    },
    {
      target: "#trial-space",
      content: (
        <>
          <p className="has-text-justified">

            You have already been invited to a trial data space. When invited to a data space, you receive some
            secrets that enable you to interact with the environment.
          </p>
          <br />
          <p className="has-text-justified">
            Note that within a data space other users may see some your personal information, they are your collaborators after all!
          </p>
        </>
      )
    }
  ]

  return (
    <>
      <Navbar />
      <Section>
        <div className="columns is-centered">
          <div className="column is-half">

            <Joyride
              run={keyStoreIsReady}
              steps={steps}
              styles={{
                options: {
                  primaryColor: "#e49bcf"
                }
              }}
              continuous={true}
            />

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

export default DataSpacesRoute;
