import React from "react";
import { Provider } from "react-redux";
import configureStore from "./store/index.js";
import { Router, Switch, Route, Redirect } from "react-router-dom";

import history from "./history";

//PA
import LoginPage from "./pages/Login";
import Layout from "./pages/Layout";
import Overview from "./pages/Overview";
import ProtocolSection from "./pages/ProtocolSection";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.scss";
import "./App.css";

const store = configureStore();

function App() {
  return (
    <Provider store={store}>
      <Router history={history}>
        <Switch>
          <Route exact path="/">
            <LoginPage />
          </Route>
          <Route exact path="/overview">
            <Layout />
          </Route>
          <Route exact path="/protocol-sections">
             <Layout />
          </Route>
          
          <Route exact path="/extraction">
             <Layout />
          </Route>
          
          <Route exact path="*" render={() => <Redirect to="/" />} />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
