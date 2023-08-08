import React, { useContext } from "react";
import "./App.css";
import BleContext, { BleProvider } from "./bt/bleManager";

function App() {
  const { setIsUsingBluetooth } = useContext(BleContext);

  const handleClick = () => {
    setIsUsingBluetooth(true);
  };

  return (
    <div className="App">
      <button onClick={handleClick}>Activate BT</button>
    </div>
  );
}

export default App;
