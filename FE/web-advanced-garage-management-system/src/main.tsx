import React from "react";
import "./index.css";
import "@/language";
import App from "./App.tsx";
import ReactDOM from "react-dom/client";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { theme } from "./styles/theme.ts";


// createRoot(document.getElementById("root")!).render(
//   <Fragment>
//     <StrictMode>
//       <App />
//     </StrictMode>
//   </Fragment>
// );

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StyledThemeProvider theme={theme}>
        <App />
      </StyledThemeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
