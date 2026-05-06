import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App.jsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env. Get it from https://dashboard.clerk.com → API Keys');
}

const clerkProps = { publishableKey: PUBLISHABLE_KEY };
if (import.meta.env.VITE_CLERK_PROXY_URL) {
  clerkProps.proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider {...clerkProps}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
