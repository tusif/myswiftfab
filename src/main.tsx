import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { PortalApp } from "./PortalApp";
import "./styles.css";

// If URL starts with /portal, render the client portal instead of the main app
const isPortal = window.location.pathname.startsWith("/portal");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isPortal ? <PortalApp /> : <App />}
  </React.StrictMode>,
);
