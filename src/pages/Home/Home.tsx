import React, { FC, useLayoutEffect, useState } from 'react'
import { Route, Switch, Link } from "react-router-dom"

import Navbar from 'components/Navbar'
import LaptopFrame from 'components/LaptopFrame'
import Footer from 'components/Footer'
import Section from 'components/Section'

import screenshotBuilder from 'assets/screenshot-builder.png'
import webm from 'assets/demo.webm'
import mp4 from 'assets/demo.mp4'

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
  useLayoutEffect(() => window.scrollTo(0, 0))

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
  const [modalIsActive, setModalIsActive] = useState(false)

  return (
    <section className="hero is-medium">
      <div className="hero-body">
        { modalIsActive && <Demo onClose={() => setModalIsActive(false)} /> }

        <div className="container">
          <div className="columns is-centered is-vcentered px-6">

            <div className="column is-narrow pl-6">
              <h1 className="title is-2 has-text-left">
                Kickstart your data collaborative
              </h1>

              <h2 className="subtitle is-4 has-text-left pt-3">
                Share and analyse data securely <br />
                across multiple organisations <br />
                on a single online platform
              </h2>
              <br></br>

              <div className="buttons is-left">
                <Link to="/register">
                  <button className="button is-medium is-primary mr-3"> Get started </button>
                </Link>
                <Link to="/login">
                  <button className="button is-medium is-outlined"> Log in </button>
                </Link>
              </div>
            </div>

            <div className="column is-1" />
            <div className="column is-two-fifths is-hidden-touch">
              <LaptopFrame image={screenshotBuilder} onClick={() => setModalIsActive(true)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface DemoProps {
  onClose: () => void
}

const Demo: FC<DemoProps> = ({ onClose }) => {
  return (
    <div className="modal is-active">
      <div className="modal-background"/>
      <div className="container">
        <div className="div is-vcentered">
          <video controls preload="auto" autoPlay={true}>
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />

            <p>
              Cannot load video
            </p>
          </video>
        </div>
      </div>

      <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
    </div>
  )
}

export default HomeRoute;
