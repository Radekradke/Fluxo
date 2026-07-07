import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./global.css";
import { registerServiceWorker } from "./pwa.js";

// Compatibilidade com códigos exportados de ambientes que usam window.storage.
// No app real, salvamos tudo no localStorage do navegador.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { ok: true };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { ok: true };
    },
  };
}

registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
