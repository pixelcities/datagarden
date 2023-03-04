import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

import store from 'state/store'

import DataSpaces from 'pages/DataSpaces'
import Sources from 'pages/Sources'
import Taxonomy from 'pages/Taxonomy'
import Builder from 'pages/Builder'
import Widgets from 'pages/Widgets'
import Profile from 'pages/Profile'
import KeyStore from 'pages/KeyStore'
import Reports from 'pages/Reports'
import Contacts from 'pages/Contacts'
import Home from 'pages/Home'

import PrivateRoute from 'utils/PrivateRoute'
import { AuthProvider } from 'contexts'
import { DataFusionProvider } from 'contexts'
import { KeyStoreProvider } from 'contexts'
import { ExecutionProvider } from 'contexts'

import 'styles/style.css'
import 'styles/style.sass'

gsap.registerPlugin(Draggable);

function App() {
  return (
    <Router basename="/">
      <Provider store={store}>
        <DndProvider backend={HTML5Backend}>
          <AuthProvider>
            <KeyStoreProvider>
              <div className="App">
                { /* Toggles between public or authenticated landing */ }
                <Home>

                  { /* Application routes */ }
                  <DataFusionProvider>
                    <ExecutionProvider store={store}>
                      <Switch>

                        { /* Profile */ }
                        <Route path="/register" component={Profile} />
                        <Route path="/login" component={Profile} />
                        <Route path="/logout" component={Profile} />
                        <PrivateRoute path="/profile" component={Profile} />

                        { /* Passthrough */ }
                        <PrivateRoute path="/auth/local/confirm/:token" component={Profile} />
                        <PrivateRoute path="/users/profile/confirm_email/:token" component={Profile} />

                        { /* Public pages */ }
                        <Route path="/pages/:handle/:id" component={Reports} />

                        { /* Main */ }
                        <DataSpaces>
                          <PrivateRoute path="/:handle/keys" component={KeyStore} />
                          <PrivateRoute path="/:handle/contacts" component={Contacts} />
                          <PrivateRoute path="/:handle/sources" component={Sources} />
                          <PrivateRoute path="/:handle/taxonomy" component={Taxonomy} />
                          <PrivateRoute path="/:handle/widgets" component={Widgets} />
                          <PrivateRoute path="/:handle/reports" component={Reports} />
                          <PrivateRoute path="/:handle/" component={Builder} />
                        </DataSpaces>

                      </Switch>
                    </ExecutionProvider>
                  </DataFusionProvider>

                </Home>
              </div>

            </KeyStoreProvider>
          </AuthProvider>
        </DndProvider>
      </Provider>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('root'))
