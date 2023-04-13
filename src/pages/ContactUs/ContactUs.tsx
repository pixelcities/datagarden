import React, { FC } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Switch } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

import Navbar from 'components/Navbar'
import Section from 'components/Section'
import Footer from 'components/Footer'


const ContactUsRoute: FC<RouteComponentProps> = ({ match }) => {
  return (
    <Switch>
      <Route path={(match.params as any).path}>
        <>
          <Navbar />
          <ContactUs />
          <Footer />
        </>
      </Route>
    </Switch>
  )
}


const ContactUs: FC = () => {
  return (
    <Section>
      <div className="container is-max-desktop" id="no-px-mobile">
        <div className="columns is-centered is-mobile">
          <div className="column is-full-mobile is-four-fifths-tablet is-three-quarters-desktop">

            <h1 className="title has-text-centered pb-5"> Contact Us </h1>

            <p className="block is-size-5">
              Hello there! Have you found a bug, issue, or do you want to share some feedback? Our
              github <span className="is-underlined"><a target="_blank" rel="noopener noreferrer" href="https://github.com/pixelcities/datagarden/issues">issue tracker</a></span> may
              be the right place for you.
            </p>

            <p className="block is-size-5">
              Do you have another question? Or do you want to chat to us directly? Contact us using our email below,
              and we'll get back to you as soon as possible.
            </p>

            <p className="block is-size-5 has-text-centered pt-5">
              <span className="icon is-left pr-1">
                <FontAwesomeIcon icon={faEnvelope} size="sm"/>
              </span>
              <a href="mailto:hello@pixelcities.io">hello@pixelcities.io</a>
            </p>

          </div>
        </div>
      </div>
    </Section>
  )
}

export default ContactUsRoute
