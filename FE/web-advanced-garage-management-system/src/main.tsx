import React from "react";
import "./index.css";
import "@/language";
import App from "./App.tsx";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./context/ThemeContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
