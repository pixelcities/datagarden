import React, { FC } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Switch } from "react-router-dom"

import Navbar from 'components/Navbar'
import Section from 'components/Section'
import Footer from 'components/Footer'


const PrivacyRoute: FC<RouteComponentProps> = ({ match }) => {
  return (
    <Switch>
      <Route path={(match.params as any).path}>
        <>
          <Navbar />
          <Privacy />
          <Footer />
        </>
      </Route>
    </Switch>
  )
}


const Privacy: FC = () => {
  const content = (
    <article>
    <h1 className="has-text-centered"> PIXELCITIES PRIVACY STATEMENT </h1>
    <br />

    <p> We at PixelCities care deeply about privacy, and we want you to care too! When you create an account on
    DataGarden, we ask for the bare minimum personal information, and throughout your continued use of DataGarden we
    ensure that only the absolutely necessary information is ever sent to our server, everything else is end-to-end
    encrypted. </p>

    <p> In this Privacy Statement we will lay out what data we collect, and why. We shall also provide an overview of
    our use of external service providers, and what data is shared with them. </p>

    <p> Finally, you do not have to take our word for it, all of our code is open source <sup><a target="_blank"
      rel="noopener noreferrer" href="https://github.com/pixelcities/datagarden">[1]</a></sup>. </p>

    <h3 id="browsing-context"> 1. Browsing context </h3>

    <p> First of all, as DataGarden is a web application, most of your experience will be through the browser. The
    privacy and security of our web application are a top priority, and while we require the use of javascript to
    provide a functional application, we ensure that no third party javascript is loaded or executed, so as to reduce
    the total number of parties you have to trust. </p>

    <p> Information we collect about all visitors includes standard HTTP request logs, which are momentarily stored in
    order to help ensure the safety and uptime of our services. This information includes the browser type, date and
    time of each request, and the IP address. Again, we ensure that no unnecessary web requests are sent to any third
    parties except those listed in <a href="#network-requests">section 4</a>, in order to keep your visit to DataGarden
    as private as possible. </p>

    <h4> 1.1. As a visitor.. </h4>

    <ul>
      <li> We do not collection any personal information </li>
      <li> We do not store any session information such as cookies in the browser </li>
      <li> No information is shared with third parties </li>
      <li> Absolutely no information is ever shared with advertisers, or sold in any way </li>
    </ul>

    <h4> 1.2 As a user.. </h4>
    <p> We require some limited information to provide you with the best experience. The following information is
    collected / stored: </p>

    <ul>
      <li><strong>An email address</strong>. We require your email address to create an account. We do not share the
      email address with anyone else, except for our payment provider when you choose to purchase a paid subscription (see
      <a href="external-service-providers"> section 3</a>). We will use your email address to communicate with you about
      important account information. </li>

      <li><strong>Persistent first-party session cookies</strong>, which ensure that your browser can safely communicate
      with the backend servers, and to remember that you are logged in. </li>
    </ul>

    <h3 id="data-context"> 2. Data context </h3>

    <p> As a user of DataGarden, you will want to upload and operate on your private datasets. We believe that if you
    care enough about data security and privacy to use a product like DataGarden, we should not be able to have access
    to your data either. For this reason, all data is fully <strong>end-to-end encrypted</strong> (E2EE), which means that
    whatever data you upload to DataGarden will remain private, even from us. </p>

    <h6> What does this mean, practically? </h6>

    <p> E2EE means, simply put, that none of your data will ever leave your browser unencrypted. Naturally, this
    includes the keys used to encrypt the data itself. When you share a column or dataset with another collaborator, you
    are effectively setting up a secure communication channel between you and the other user using the Signal Protocol
    <sup><a target="_blank" rel="noopener noreferrer" href="https://www.signal.org/docs">[2]</a></sup>, through which
    you share the secret keys. The server never sees any of these keys, and in turn cannot decrypt or understand your
    data. </p>

    <p> This does not just include the data itself, it also extends to the metadata including dataset title, column
    titles, and data types. Any of the reports and charts you create out of your data is treated, by default, as encrypted
    metadata too. In summary, if we have no need for a piece of information, we do not wish to have access to it. </p>

    <h6> What <u>is</u> shared? </h6>

    <p> The information that <i>is</i> shared with the server, is linkage data about who owns what, who has access, and
    what operations need to be computed on a dataset. Again, we cannot do these computations ourselves as we do not have
    access to that data, but our servers <i>do</i> manage the scheduling of said operations. Some information leakage
    about the context of your data is technically possible if this data were to be inspected. </p>

    <p> As a result, you must assume that the server knows the following: </p>
    <ul>
      <li> The size of your dataset </li>
      <li> The number of rows </li>
      <li> The number of columns </li>
      <li> A best guess at the datatypes due to the type of operations you perform on it </li>
      <li> Which columns are categorical, based on your usage in charts or joins </li>
      <li> Weak information on the correlation structure of columns, based on how frequently they mutate together </li>
    </ul>

    <p> We do not purposefully track or attempt to gather information about your data, and even if you assume the worst,
    a “column” consists of just a random UUID in the server's context. </p>

    <p> To conclude, with the limited information we have available on the server, we have just enough to conclude who owns
    what data, so that we, in turn, can guarantee that other collaborators are held to their appropriate ownership and do
    not step out of their bounds. With this information, we strive to make your collaborative environment as safe and
    enjoyable as possible. </p>

    <h3 id="external-service-providers"> 3. External Service Providers </h3>

    <p> In order to provide our service, we require the use of a limited number of third party service providers: </p>

    <ul>
      <li>
        <p><strong>Amazon Web Services (AWS)</strong>. We use AWS to host our infrastructure, which includes the servers
        but also the data storage (S3), which houses all of your encrypted data. No information is explicitly shared
        with AWS, but all data as described in this document is stored on their servers. See their data protection and
        compliance resources for more information <sup><a target="_blank" rel="noopener noreferrer"
          href="https://aws.amazon.com/compliance/iso-27018-faqs">[3]</a></sup>. </p>

        <p> We also use AWS SES to handle email delivery. This includes account confirmations, invites, and other
        important information related to your account. </p>
      </li>

      <li> <strong>Paddle</strong>. The payment processing is handled by Paddle. If you choose to create a new Data
      Space, the billing information and payment process during the checkout is handled by Paddle. See their privacy
      policy for more details <sup><a target="_blank" rel="noopener noreferrer"
        href="https://paddle.com/privacy-buyers">[4]</a></sup> </li>
    </ul>

    <h3 id="network-requests"> 4. Network requests </h3>

    <p> The following third party outbound network requests are possible when you use our service: </p>
    <ul>
      <li> <strong>When you create, load, or otherwise interact with a dataset</strong>. The data will have to be loaded
      or saved to AWS S3. This means that your browser will directly connect to our S3 bucket located at
      <i> https://pxc-collection-store.s3.eu-west-1.amazonaws.com</i>. </li>

      <li> <strong>When you create a new Data Space, or alter any existing subscriptions</strong>. Data Spaces require
      an active subscription, and all payment processing is handled by the Paddle Checkout located at:
      <i> https://a.paddle.com/checkout/</i> and <i>https://checkout.paddle.com</i>. </li>
    </ul>

    <h3 id="data-retention"> 5. Data Retention </h3>
    <p> We will retain your information for as long as your account is active, or as long as is necessary to comply with
    our legal obligations. </p>

    <p> You can delete your DataGarden account at any time <sup><a target="_blank" rel="noopener noreferrer"
    href="https://datagarden.app/profile#delete">[5]</a></sup>. All your personal information will be permanently
    deleted immediately. </p>

    <h3 id="changes"> 6. Changes </h3>

    <p> We may update this statement to reflect changes in our services, practices, or to communicate the use of new
    external service providers. Check back regularly to stay up to date. </p>

    <p> Contact us at <a href="mailto:hello@pixelcities.io">hello@pixelcities.io</a> if you have any questions or concerns about this privacy statement. </p>

    <br />
    <p> Last updated: 2023-04-07 </p>

    </article>
  )

  const footnotes = (
    <div className="content no-wrap no-block is-small px-1">
      <div className="divider" />
      <p><sup>[1] </sup><a target="_blank" rel="noopener noreferrer" href="https://github.com/pixelcities/datagarden">https://github.com/pixelcities/datagarden</a></p>
      <p><sup>[2] </sup><a target="_blank" rel="noopener noreferrer" href="https://www.signal.org/docs">https://www.signal.org/docs</a></p>
      <p><sup>[3] </sup><a target="_blank" rel="noopener noreferrer" href="https://aws.amazon.com/compliance/iso-27018-faqs">https://aws.amazon.com/compliance/iso-27018-faqs</a></p>
      <p><sup>[4] </sup><a target="_blank" rel="noopener noreferrer" href="https://paddle.com/privacy-buyers">https://paddle.com/privacy-buyers</a></p>
      <p><sup>[5] </sup><a target="_blank" rel="noopener noreferrer" href="https://datagarden.app/profile#delete">https://datagarden.app/profile#delete</a></p>
    </div>
  )

  return (
    <Section>
      <div className="container is-max-desktop" id="no-px-mobile">
        <div className="columns is-centered is-mobile">
          <div className="column is-full-mobile is-four-fifths-tablet is-three-quarters-desktop">
            <div className="content has-text-justified px-1">
              { content }
            </div>

            { footnotes }

          </div>
        </div>
      </div>
    </Section>
  )
}

export default PrivacyRoute
