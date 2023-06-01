import React, { FC, useLayoutEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Switch } from "react-router-dom"

import Navbar from 'components/Navbar'
import Section from 'components/Section'
import Footer from 'components/Footer'

import plugImg from 'assets/plug.png'

const ErrorRoute: FC<RouteComponentProps> = ({ match }) => {
  return (
    <Switch>
      <Route path={(match.params as any).path}>
        <>
          <Navbar />
          <Error />
          <Footer />
        </>
      </Route>
    </Switch>
  )
}

const Error: FC = () => {
  useLayoutEffect(() => window.scrollTo(0, 0))
  useLayoutEffect(() => {
    setTimeout(() => window.location.href = "/", 5000)
  })

  return (
    <Section>
      <div className="container pt-6">
        <h1 className="title is-size-5 has-text-centered pt-5 pb-4">
          Oh no
        </h1>

        <div className="has-text-centered pb-1">
          <figure className={"image is-256x256 is-inline-block background-" + Math.floor(Math.random() * (19 - 1) + 1)}>
            <img src={plugImg} alt="" />
          </figure>
        </div>

        <h1 className="subtitle is-size-5 has-text-centered py-5">
          Something went wrong. Let's start over..
        </h1>

      </div>
    </Section>
  )
}

export default ErrorRoute
