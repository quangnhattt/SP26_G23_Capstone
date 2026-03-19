import Splash from "@/components/layout/AuthLayout/Splash";
import useAuth from "@/hooks/useAuth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import HomePage from "@/pages/home/home.page";
import ServicesPage from "@/pages/services/services.page";
import { ROUTER_PAGE } from "./contants";
import PricingPage from "@/pages/pricing/pricing.page";
import AboutPage from "@/pages/about/about.page";
import ContactPage from "@/pages/contact/contact.page";

const AppRoutesContent = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <Splash />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTER_PAGE.services} element={<ServicesPage />} />
        <Route path={ROUTER_PAGE.pricing} element={<PricingPage />} />
        <Route path={ROUTER_PAGE.about} element={<AboutPage />} />
        <Route path={ROUTER_PAGE.contact} element={<ContactPage />} />
      </Route>
    </Routes>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutesContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
