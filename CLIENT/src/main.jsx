// main.jsx — Entry point for the React application.
// ReactDOM.createRoot renders the <App /> component into the "root" div in index.html.
// React.StrictMode enables extra development warnings to help catch common mistakes.
// Mental model: State → Component → UI

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
