import React, { FC } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route, Switch } from "react-router-dom"

import Navbar from 'components/Navbar'
import Section from 'components/Section'
import Footer from 'components/Footer'


const TermsRoute: FC<RouteComponentProps> = ({ match }) => {
  return (
    <Switch>
      <Route path={(match.params as any).path}>
        <>
          <Navbar />
          <Terms />
          <Footer />
        </>
      </Route>
    </Switch>
  )
}



const Terms: FC = () => {
  const content = (
    <article>
      <h1 className="has-text-centered"> TERMS OF SERVICE </h1>
      <br />

      <h3 id="introduction"> 1. Introduction </h3>

      <p> Welcome to DataGarden, a PixelCities B.V. (“Company”, “we”, “our”, “us”) product. These Terms of Service
      govern your use of our hosted service located at <a target="_blank" rel="noopener noreferrer"
      href="https://datagarden.app">https://datagarden.app</a> (“Service”, “service”, “product”, “platform”), operated
      by PixelCities B.V., and any services connected with that offering. </p>

      <p> DataGarden is Free and Open-Source Software (FOSS), and a copy of the FOSS licence is made available through
      our source code <sup><a target="_blank" rel="noopener noreferrer"
      href="https://github.com/pixelcities/datagarden/blob/main/LICENSE">[1]</a></sup>. </p>

      <p> Our Privacy Statement also governs your use of our service and explains how we collect, safeguard and disclose
      information that results from your use of our web pages. Please read it here: <a target="_blank" rel="noopener
      noreferrer" href="https://datagarden.app/privacy">https://datagarden.app/privacy</a>. </p>

      <p> When you use our service, now or in the future, you are agreeing that you have read and understood the latest
      Terms of Service and our Privacy Statement. </p>

      <p> If you do not agree to these Terms of Service, you cannot use this service. </p>

      <h3 id="account-terms"> 2. Account terms </h3>

      <p> When you create an account with us, you guarantee that the information you provide us is accurate, complete, and
      current at all times. </p>

      <p> You are responsible for maintaining the security of your account, password, and related secrets. You agree to accept
      responsibility for any and all activities or actions that occur under your account. </p>

      <p> We reserve the right to refuse service and terminate accounts at our sole discretion. </p>

      <h3 id="payment"> 3. Payment </h3>

      <p> In order to create a “Data Space”, a paid subscription is required. You will be billed in advance on a
      recurring basis. Billing cycles are set on a monthly or annual basis, depending on the subscription plan you
      select when purchasing a subscription. At the end of each billing cycle, your subscription will automatically
      renew. </p>

      <p> As a paying customer, you will be charged a fixed fee per user in each of your “Data Spaces” with
      a subscription plan. When the number of users in a paid “Data Space” is changed you will be charged the prorated
      difference at the start of the next billing period. You are responsible for the number of active users in your
      “Data Space”. </p>

      <p> We reserve the right to refuse or cancel your subscription at any time, for reasons including but not limited
      to: service availability, price errors, and/or other reasons. </p>

      <p> Payments are conducted by our payment processor, Paddle. See Paddle’s Terms of Use <sup><a target="_blank"
      rel="noopener noreferrer" href="https://paddle.com/legal/">[2]</a></sup> for details. </p>

      <h6 id="fee-changes"> 3.1. Fee Changes </h6>

      <p> PixelCities B.V. reserves the right to, at any time, modify subscription fees for the subscription plans. </p>

      <p> For existing customers, subscription fee changes will become effective at the end of the active billing cycle. We
      will give at least 30 days of notice via the provided email address to give you an opportunity to terminate your
      subscription before the changes become effective. </p>

      <h6 id="refunds"> 3.2. Refunds </h6>

      <p> Fees paid are non-refundable. </p>

      <h3 id="content"> 4. Content </h3>

      <p> Our service allows you to create public reports, which may contain content such as text, graphics, and/or other
      information. You are responsible for the content that you create and/or share publicly, including its legality and
      appropriateness. </p>

      <p> By publicly sharing content through our service, you warrant that the content is yours and/or that you have the
      right to use it, including the right to share it through our service. </p>

      <p> You retain any and all rights of any content you submit, upload, share, or otherwise make available, and you are
      responsible for protecting those rights. We claim no intellectual property rights over the content you provide to the
      service; we take no responsibility and assume no liability for content you make available through our service. All
      data remains yours. </p>

      <p> You may provide us with feedback about the service. You agree that we own all rights to use and incorporate the
      feedback you provide in any way, without payment or attribution to you. </p>

      <p> PixelCities B.V. reserves the right to make content unavailable, at our discretion. </p>

      <h3 id="use"> 5. Use </h3>

      <p> You may not use our service for any illegal purpose or to violate any laws in your jurisdiction. In addition,
      you agree not to use our service: </p>

      <ul>
        <li> To share or otherwise make available any advertising or promotional material that may be considered spam,
        including other similar applications. </li>

        <li> To infringe upon the rights of others, or to engage in any conduct, as determined by us, that restricts or
        inhibits anyone’s use of the service. </li>

        <li> To operate in any way that could disable, damage, impair, or negatively affect the service. </li>

        <li> To attempt to gain unauthorised access to any parts of the service and/or the infrastructure used to host
        the service. </li>

        <li> To attempt to gain unauthorised access to data and/or content owned by other users of the service. </li>
      </ul>

      <h3 id="changes-to-service"> 6. Changes to Service </h3>

      <p> PixelCities B.V. shall not be liable for any modifications and/or discontinuations of the provided service. We
      reserve the right to withdraw or amend our service, and any services or material provided via our service, at
      any time and without notice. We will not be liable if any part of the service is unavailable at any time or for
      any period. </p>

      <h3 id="changes-to-terms"> 7. Changes to Terms </h3>

      <p> We reserve the right to amend these Terms of Service from time to time without notice. It is your
      responsibility to review these terms periodically. </p>

      <p> Your continued use of the service subsequent to the posting of the amended terms equals your agreement to the
      terms. You agree to be bound by the revised terms, if you do not agree to the new terms you can no longer use this
      service. </p>

      <h3 id="disclaimer"> 8. Disclaimer </h3>

      <p> Your use of this service is at your sole risk. The service is provided on an “as is” and “as available” basis. </p>

      <h3 id="liability"> 9. Liability </h3>

      <p> You expressly understand and agree that PixelCities B.V. shall not be liable to you or to any third party for
      any direct, indirect, incidental, special, consequential, or exemplary damages, including, but not limited to,
      any loss of profit, goodwill, data, or other intangible losses, however caused and under any theory of liability.
      </p>

      <h3 id="contact-us"> 10. Contact Us </h3>

      <p> If you have a question about any of these terms, please contact us at: <a
      href="mailto:hello@pixelcities.io">hello@pixelcities.io</a>. </p>

      <br />
      <p> Last updated: 2023-04-06 </p>
    </article>
  )

  const footnotes = (
    <div className="content no-wrap no-block is-small px-1">
      <div className="divider" />
      <p><sup>[1] </sup><a target="_blank" rel="noopener noreferrer" href="https://github.com/pixelcities/datagarden/blob/main/LICENSE">https://github.com/pixelcities/datagarden/blob/main/LICENSE</a></p>
      <p><sup>[2] </sup><a target="_blank" rel="noopener noreferrer" href="https://paddle.com/legal/">https://paddle.com/legal/</a></p>
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

export default TermsRoute
