import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

import store from 'state/store'

import DataSpaces from 'pages/DataSpaces'
import Sources from 'pages/Sources'
import Builder from 'pages/Builder'
import Profile from 'pages/Profile'
import KeyStore from 'pages/KeyStore'

import PrivateRoute from 'utils/PrivateRoute'
import { AuthProvider } from 'contexts'
import { DataFusionProvider } from 'contexts'
import { KeyStoreProvider } from 'contexts'
import { ExecutionProvider } from 'contexts'

gsap.registerPlugin(Draggable);

function App() {
  return (
    <Router basename="/">
      <Provider store={store}>
        <DndProvider backend={HTML5Backend}>
          <AuthProvider>
            <KeyStoreProvider>
              <DataFusionProvider>
                <ExecutionProvider store={store}>
                  <div className="App">
                    <Switch>
                      { /* Profile */ }
                      <Route path="/register" component={Profile} />
                      <Route path="/login" component={Profile} />
                      <Route path="/logout" component={Profile} />
                      <PrivateRoute path="/profile" component={Profile} />

                      { /* Passthrough */ }
                      <PrivateRoute path="/auth/local/confirm/:token" component={Profile} />
                      <PrivateRoute path="/users/profile/confirm_email/:token" component={Profile} />

                      { /* Main */ }
                      <DataSpaces>
                        <PrivateRoute path="/:handle/keys" component={KeyStore} />
                        <PrivateRoute path="/:handle/sources" component={Sources} />
                        <PrivateRoute path="/:handle/" component={Builder} />
                      </DataSpaces>

                    </Switch>
                  </div>
                </ExecutionProvider>
              </DataFusionProvider>
            </KeyStoreProvider>
          </AuthProvider>
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default App;
