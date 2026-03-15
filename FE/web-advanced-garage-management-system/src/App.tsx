import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { lazy, Suspense } from "react";
import { useTheme } from "./context/ThemeContext";
import { DeviceProvider } from "./context/DeviceContext";
import { UAParser } from "ua-parser-js";
import GlobalStyle from "./constants/globalStyle";
import { ThemeProvider } from "styled-components";
import { I18nextProvider } from "react-i18next";
import i18next from "./language";
import { ConfigProvider } from "antd";
import en_US from "antd/lib/locale/en_US";
import { Provider } from "react-redux";
import store from "./store/store";
import { LoadingProvider } from "./context/LoadingContent";
import QueryProvider from "./context/QueryProvider";

// Lazy load components
const ToastContainer = lazy(() => 
  import("react-toastify").then(module => ({ default: module.ToastContainer }))
);
const AppRoutes = lazy(() => import("./routes/AppRoutes"));

function App() {
  const { theme } = useTheme();

  let initialDeviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (typeof window !== "undefined") {
    const parser = new UAParser();
    const result = parser.getResult();
    initialDeviceType =
      (result.device.type as "mobile" | "tablet" | "desktop") || "desktop";
  }

  return (
    <DeviceProvider initialDeviceType={initialDeviceType}>
      <Suspense fallback={null}>
        <ToastContainer position="top-right" autoClose={3000} />
      </Suspense>
      <GlobalStyle theme={theme} />
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18next}>
          <ConfigProvider locale={en_US}>
            <Provider store={store}>
              <LoadingProvider>
                <QueryProvider>
                  <Suspense fallback={<div>Loading...</div>}>
                    <AppRoutes />
                  </Suspense>
                </QueryProvider>
              </LoadingProvider>
            </Provider>
          </ConfigProvider>
        </I18nextProvider>
      </ThemeProvider>
    </DeviceProvider>
  );
}

export default App;
