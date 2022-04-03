import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

import store from 'state/store'

import Sources from 'pages/Sources';
import Builder from 'pages/Builder';
import Profile from 'pages/Profile';
import KeyStore from 'pages/KeyStore';

import PrivateRoute from 'utils/PrivateRoute';
import { AuthProvider } from 'utils/AuthContext';
import { DataFusionProvider } from 'utils/DataFusionContext';
import { KeyStoreProvider } from 'utils/KeyStoreContext';

gsap.registerPlugin(Draggable);

function App() {
  return (
    <Router basename="/">
      <Provider store={store}>
        <DndProvider backend={HTML5Backend}>
          <AuthProvider>
            <KeyStoreProvider>
              <DataFusionProvider>
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

                    <PrivateRoute path="/keys" component={KeyStore} />
                    <PrivateRoute path="/sources" component={Sources} />
                    <PrivateRoute path="/" component={Builder} />

                  </Switch>
                </div>
              </DataFusionProvider>
            </KeyStoreProvider>
          </AuthProvider>
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default App;
