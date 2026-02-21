import Splash from "@/components/layout/Splash";
import useAuth from "@/hooks/useAuth";
import type React from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";


const AppRoutes: React.FC = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <Splash />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes></Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
