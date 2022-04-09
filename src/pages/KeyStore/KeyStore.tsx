import React, { FC, Component, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Route } from "react-router-dom";

import Navbar from 'components/Navbar'
import Section from 'components/Section';

import { useKeyStoreContext } from 'utils/KeyStoreContext'

class KeyStoreRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path;

  render() {
    return (
      <div>
        <Navbar />

        <Route path={this.parentPath} component={KeyStore} />
      </div>
    )
  }
}

const KeyStore: FC = () => {
  const { keyStore, protocol } = useKeyStoreContext();

  useEffect(() => {
    console.log("KeyStore: ", keyStore)
    console.log("protocol: ", protocol)
  }, [keyStore, protocol])

  return (
    <Section>
      <p> KeyStore is locked: { keyStore?.is_locked() ? "true" : "false" } </p>
    </Section>
  )
}

export default KeyStoreRoute;
