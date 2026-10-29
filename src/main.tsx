import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Universe checklist root element is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
    console.error("Universe checklist service worker registration failed.", error);
  });
}
