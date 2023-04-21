import React, { FC } from 'react'
import { Link } from "react-router-dom"

import backdropbird from 'assets/footer.svg'
import logo from 'assets/logo-yellow.svg';

import './Footer.sass';

const Footer: FC = () => {
  return (
    <footer className="footer-no-padding">
      <div className="anchor" id="contact"></div>
      <div className="pl-6">
          <img src={backdropbird} alt="" width="128"/>
      </div>

      <div className="footer-background">
        <div className="container py-6">
          <div className="columns is-centered px-6 is-vcentered" id="no-px-mobile">

            <div className="column is-three-fifths ml-6">
              <h1 className="title has-text-left">
                <img src={logo} width="320" height="80" alt="PIXELCITIES"></img>
              </h1>

              <p className="subtitle has-text-left has-text-primary-light is-size-6 mr-6">
                PixelCities builds data ecosystems for sustainable development through the aggregation of relevant knowledge into multi stakeholder data pools
              </p>
            </div>

            <div className="column is-one-third mx-6">
              <div className="columns">
                <div className="column is-half">
                  <h1 className="title has-text-primary-light is-size-4">
                    Product
                  </h1>

                  <a className="has-text-primary-light is-size-6 is-flex" target="_blank" rel="noopener noreferrer" href="https://docs.datagarden.app"> Documentation </a>
                  <Link className="has-text-primary-light is-size-6 is-flex" to="/pricing"> Pricing </Link>
                </div>

                <div className="column is-half">
                  <h1 className="title has-text-primary-light is-size-4">
                    Company
                  </h1>

                  <Link className="has-text-primary-light is-size-6 is-flex" to="/privacy"> Privacy </Link>
                  <Link className="has-text-primary-light is-size-6 is-flex" to="/terms"> Terms </Link>
                  <Link className="has-text-primary-light is-size-6 is-flex" to="/contact"> Contact </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        <br />
        <p className="fineprint-label has-text-centered is-light"> v{process.env.REACT_APP_VERSION} </p>
      </div>
    </footer>
  )
}

export default Footer;
