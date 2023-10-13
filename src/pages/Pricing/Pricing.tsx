import React, { FC, useLayoutEffect } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Switch, Link } from "react-router-dom"

import Navbar from 'components/Navbar'
import Section from 'components/Section'
import Footer from 'components/Footer'

import { useAuthContext } from 'contexts'


const PricingRoute: FC<RouteComponentProps> = ({ match }) => {
  return (
    <Switch>
      <Route path={(match.params as any).path}>
        <>
          <Navbar />
          <Pricing />
          <Footer />
        </>
      </Route>
    </Switch>
  )
}



const Pricing: FC = () => {
  useLayoutEffect(() => window.scrollTo(0, 0))

  const { isAuthenticated } = useAuthContext()

  return (
    <Section>
      <div className="container is-max-desktop" id="no-px-mobile">
        <h1 className="title has-text-centered pb-4">
          Pricing
        </h1>

        <p className="subtitle has-text-justified">
          DataGarden is billed per data space, based on the number of members. Creating an account does not require a
          credit card, and neither does collaborating in other data spaces: only the owner is billed.
        </p>

        <p className="subtitle has-text-justified pb-6">
          When you want to create your own data space, it will require an active subscription. Subscriptions are billed monthly,
          based on the number of members in the data space.
        </p>

        <div className="box">
          <div className="columns is-centered is-mobile">
            <div className="column is-5">
              <h3 className="header-label label-size-4 py-5 is-justify-content-center">
                Early bird
              </h3>

              <p className="has-text-justified" style={{minHeight: "6rem"}}>
                Create a data space and invite up to two other members, for free!, for as long as DataGarden is in beta.
                Get started quickly and explore the platform.
              </p>

              <h3 className="has-text-centered py-6">
                <span className="is-size-6">$</span><span className="is-size-4 has-text-weight-semibold">0</span>
              </h3>

              <p className="has-text-centered">
                Up to three members
              </p>

            </div>

            <div className="column is-1 divider is-vertical mx-0" />

            <div className="column is-5">
              <h3 className="header-label label-size-4 py-5 is-justify-content-center">
                Standard
              </h3>

              <p className="has-text-justified" style={{minHeight: "6rem"}}>
                Kickstart your data collaborative! Create your own private data space, and share and analyse your data securely, with unlimited members.
              </p>

              <h3 className="has-text-centered py-6">
                <span className="is-size-6">$</span><span className="is-size-4 has-text-weight-semibold">20</span>
              </h3>

              <p className="has-text-centered">
                Per member / month
              </p>

            </div>

          </div>

          <div className="pt-6 mx-4">
            <Link className="button is-primary is-outlined is-fullwidth" to={isAuthenticated ? "/checkout" : "/register"}>
              Create your data space
            </Link>
          </div>

        </div>
      </div>
    </Section>
  )
}

export default PricingRoute
