import React from "react";
import "./App.css";
import "./static/css/index.css";
import "./static/css/spinner.css";
import DataReport from "./pages/data";
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <DataReport />
      </header>
    </div>
  );
}

export default App;
