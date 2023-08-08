import React from "react";
import logo from "./logo.svg";
import "./App.css";
import BleContext, { BleProvider } from "./bt/bleManager";
import Main from "./Main";

function App() {
  return (
    <BleProvider>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Main />
        </header>
      </div>
    </BleProvider>
  );
}

export default App;
