import React, { createContext, useReducer } from "react";

import appReducer from "./AppReducer";

const initialState = {
  isHost: false,
};

export const GlobalContext = createContext(initialState);

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  function setHost(status) {
    dispatch({
      type: "SET_HOST",
      payload: status,
    });
  }

  return (
    <GlobalContext.Provider
      value={{
        isHost: state.isHost,
        setHost,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
