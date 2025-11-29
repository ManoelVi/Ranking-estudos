import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" não encontrado no index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
