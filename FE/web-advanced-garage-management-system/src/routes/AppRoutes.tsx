import Splash from "@/components/layout/AuthLayout/Splash";
import useAuth from "@/hooks/useAuth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { ROUTER_PAGE } from "./contants";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const HomePage = lazy(() => import("@/pages/home/home.page"));
const ServicesPage = lazy(() => import("@/pages/services/services.page"));
const PricingPage = lazy(() => import("@/pages/pricing/pricing.page"));
const AboutPage = lazy(() => import("@/pages/about/about.page"));
const ContactPage = lazy(() => import("@/pages/contact/contact.page"));
const AdminDashboard = lazy(() => import("@/pages/admin/admin.page"));

const AppRoutesContent = () => {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <Splash />;
  }

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTER_PAGE.services} element={<ServicesPage />} />
          <Route path={ROUTER_PAGE.pricing} element={<PricingPage />} />
          <Route path={ROUTER_PAGE.about} element={<AboutPage />} />
          <Route path={ROUTER_PAGE.contact} element={<ContactPage />} />
          <Route path={ROUTER_PAGE.admin} element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Suspense>
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
