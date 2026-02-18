// main.jsx — The application entry point.
// This file mounts the root React component into the DOM.
// React.StrictMode enables extra development warnings to help catch common mistakes.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
