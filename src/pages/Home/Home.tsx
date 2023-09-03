import React, { FC, useLayoutEffect, useState } from 'react'
import { Route, Switch, Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserLock, faLaptopHouse, faDatabase, faAngleDown } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import LaptopFrame from 'components/LaptopFrame'
import Footer from 'components/Footer'

import screenshotBuilder from 'assets/screenshot-builder.png'
import webm from 'assets/demo.webm'
import mp4 from 'assets/demo.mp4'

import { useAuthContext } from 'contexts'
import useEventListener from 'hooks/useEventListener'

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

      <Hero />
      <Features />
      <Using />
      <YellowCTA />

      <Footer />
    </>
  )
}

const Hero: FC = (props) => {
  const [modalIsActive, setModalIsActive] = useState(false)
  const [hideScroll, setHideScroll] = useState(false)

  useEventListener('scroll',
    null,
    (e: MouseEvent) => {
      e.preventDefault()
      if (!hideScroll) {
        setHideScroll(true)
      }
    },
    { passive: false }
  )

  return (
    <section className="section-fullheight">
      <div className="hero is-medium">
        <div className="hero-body">
          { modalIsActive && <Demo onClose={() => setModalIsActive(false)} /> }

          <div className="container">
            <div className="columns is-centered is-vcentered px-6">

              <div className="column is-narrow pl-6">
                <h1 className="title is-2 has-text-left">
                  Kickstart your data collaborative
                </h1>

                <h2 className="subtitle is-4 has-text-left pt-3">
                  Explore the potential value of data sharing <br />
                  through our easy-to-use secure sandbox
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
      </div>

      <div style={{position: "absolute", bottom: "4rem", left: "50%"}}>
        <p className="has-text-centered is-relative" style={{paddingTop: "-4rem"}}>
          <span className={"icon " + (hideScroll ? "hide" : "updown")}>
            <FontAwesomeIcon icon={faAngleDown} size="2x"/>
          </span>
        </p>
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

const Features: FC = (props) => {

  return (
    <section className="section" style={{backgroundColor: "#e6e8e7"}}>
      <div className="container">

        <h1 className="title is-4 has-text-centered pt-4">
          Share and analyse data securely across multiple organisations on a single online platform
        </h1>

        <div className="level py-6">
          <div className="level-item has-text-centered">
            <div className="box is-flex is-align-content-center" style={{backgroundColor: "#3457a6", width: "21rem", height: "10rem"}}>

              <p className="title has-text-success is-3 has-text-centered" style={{margin: "auto"}}>
                In browser realtime collaboration
              </p>
            </div>
          </div>

          <div className="level-item has-text-centered">
            <div className="box is-flex is-align-content-center" style={{backgroundColor: "#3457a6", width: "21rem", height: "10rem"}}>

              <p className="title has-text-success is-3 has-text-centered" style={{margin: "auto"}}>
                Visual pipeline builder
              </p>
            </div>
          </div>

          <div className="level-item has-text-centered">
            <div className="box is-flex is-align-content-center" style={{backgroundColor: "#3457a6", width: "21rem", height: "10rem"}}>

              <p className="title has-text-success is-3 has-text-centered" style={{margin: "auto"}}>
                State of the art privatisation techniques
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}


const Using: FC = (props) => {
  return (
    <section className="section">
      <div className="container">

        <h1 className="title is-4 has-text-centered pt-4">
          DataGarden is a data collaboration platform built on and using:
        </h1>

        <div className="level py-7">
          <div className="level-item has-text-centered">
            <div className="box" style={{width: "22rem", height: "17.5rem"}}>

              <div className="columns is-centered">
                <div className="column is-2 is-flex is-align-content-center">
                  <h3 className="title is-4 is-flex is-align-items-center">
                    <span className="icon is-medium">
                      <FontAwesomeIcon icon={faUserLock} size="lg"/>
                    </span>
                  </h3>
                </div>

                <div className="column is-8">
                  <h3 className="title is-4 has-text-centered py-5" style={{marginLeft: "-2rem"}}>
                    End-to-end encryption
                  </h3>
                </div>
              </div>

              <p className="subtitle is-5 has-text-centered pb-5">
                Communication, including sharing data keys, between collaborators is secured by the Signal Protocol
              </p>
            </div>
          </div>

          <div className="level-item has-text-centered">
            <div className="box" style={{width: "22rem", height: "17.5rem"}}>

              <div className="columns is-centered">
                <div className="column is-2 is-flex is-align-content-center">
                  <h3 className="title is-4 is-flex is-align-items-center">
                    <span className="icon is-medium">
                      <FontAwesomeIcon icon={faLaptopHouse} size="lg"/>
                    </span>
                  </h3>
                </div>

                <div className="column is-8">
                  <h3 className="title is-4 has-text-centered py-5" style={{marginLeft: "-2rem"}}>
                    Fast in-memory computation
                  </h3>
                </div>
              </div>

              <p className="subtitle is-5 has-text-centered pb-5">
                Data is computed locally in your browser using Apache Arrow
              </p>
            </div>
          </div>

          <div className="level-item has-text-centered">
            <div className="box" style={{width: "22rem", height: "17.5rem"}}>

              <div className="columns is-centered">
                <div className="column is-2 is-flex is-align-content-center">
                  <h3 className="title is-4 is-flex is-align-items-center">
                    <span className="icon is-medium">
                      <FontAwesomeIcon icon={faDatabase} size="lg"/>
                    </span>
                  </h3>
                </div>

                <div className="column is-8">
                  <h3 className="title is-4 has-text-centered py-5" style={{marginLeft: "-2rem"}}>
                    Industry standard data storage
                  </h3>
                </div>
              </div>

              <p className="subtitle is-5 has-text-centered pb-5">
                Encrypted data is stored as Apache Parquet on AWS S3
              </p>
            </div>
          </div>

        </div>

        <p className="is-pulled-right">
          Read more about how we use encryption <a className="is-underlined" href="https://docs.datagarden.app/encryption.html">here</a>.
        </p>
      </div>
    </section>

  )
}


const YellowCTA: FC = (props) => {
  return (
    <section className="section-primary-light">
      <div className="container">
        <h1 className="title is-3 has-text-primary has-text-centered py-6">
          Quick, safe and simple.
        </h1>
      </div>

      <section className="container is-max-desktop">
        <div className="columns is-mobile">
          <div className="column is-variable is-offset-10-desktop is-4-desktop is-offset-6-touch is-6-touch">
            <Link to="/register">
              <div className="buttons is-right pt-5">
                <button className="button is-medium is-fullwidth is-primary">
                  Get started
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <br /> <br /> <br />
    </section>
  )
}


export default HomeRoute;
