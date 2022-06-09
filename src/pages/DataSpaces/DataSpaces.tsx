import React, { FC, useEffect, useState, useMemo } from 'react'
import { Route, Redirect, Switch, Link, useParams } from "react-router-dom"
import PrivateRoute from 'utils/PrivateRoute'

import Section from 'components/Section'
import Navbar from 'components/Navbar'

import { DataSpace } from 'types'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectActiveDataSpace } from 'state/selectors'
import { setActiveDataSpace } from 'state/actions'


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
        <div key={dataSpace.id} className="column is-narrow">

          <Link to={`/${dataSpace.handle}`} onClick={() => dispatch(setActiveDataSpace(dataSpace))}>
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

            <h2 className="subtitle pt-3 is-size-4 has-text-centered">
              Choose a Data Space
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
