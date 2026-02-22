import Splash from "@/components/layout/AuthLayout/Splash";
import useAuth from "@/hooks/useAuth";
import type React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";


const AppRoutes: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <Splash />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={"/"} element={<MainLayout/>}></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
