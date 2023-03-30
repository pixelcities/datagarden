import React, { FC } from 'react'
import { Route, Switch, Link } from "react-router-dom"

import Navbar from 'components/Navbar'
import LaptopFrame from 'components/LaptopFrame'
import Footer from 'components/Footer'
import Section from 'components/Section'

import screenshotBuilder from 'assets/screenshot-builder.png'

import { useAuthContext } from 'contexts'


const HomeRoute: FC = ({ children }) => {
  const { isAuthenticated } = useAuthContext()

  return (
    <Switch>
      <Route
        exact path="/"
        render={() =>
          !isAuthenticated
            ? <LandingPage />
            : <Switch> { children } </Switch>
        }
      />
      <Switch>
        { children }
      </Switch>
    </Switch>
  )
}

const LandingPage: FC = () => {

  return (
    <>
      <Navbar />

      <Section backdrop={true}>
        <Hero />
      </Section>

      <Footer />
    </>
  )
}

const Hero: FC = (props) => {
  return (
    <section className="hero is-medium">
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered is-vcentered px-6">

            <div className="column is-narrow pl-6">
              <h1 className="title is-2 has-text-left">
                Scale data driven <br />
                multistakeholder collaborations
              </h1>

              <h2 className="subtitle is-4 has-text-left pt-3">
                Share and analyse data securely <br />
                across multiple organisations <br />
                on a single online platform
              </h2>
              <br></br>

              <div className="buttons is-left">
                <Link to="/register">
                  <button className="button is-medium is-outlined mr-3"> Register </button>
                </Link>
                <Link to="/login">
                  <button className="button is-medium is-primary"> Log in </button>
                </Link>
              </div>
            </div>

            <div className="column is-1" />
            <div className="column is-two-fifths is-hidden-touch">
              <LaptopFrame image={screenshotBuilder} />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeRoute;
