import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import React from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { GlobalProvider } from "./context/GlobalState";
import App from "./App";
import "./index.css";

const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
};

const subgraphUri = "http://localhost:8000/subgraphs/name/scaffold-eth/your-contract";

const client = new ApolloClient({
  uri: subgraphUri,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={"dark"}>
      <GlobalProvider>
        <Router>
          <App subgraphUri={subgraphUri} />
        </Router>
      </GlobalProvider>
    </ThemeSwitcherProvider>
  </ApolloProvider>,
  document.getElementById("root"),
);
