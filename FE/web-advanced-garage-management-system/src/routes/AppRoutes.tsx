import Splash from "@/components/layout/AuthLayout/Splash";
import useAuth from "@/hooks/useAuth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { ROUTER_PAGE } from "./contants";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/home/home.page"));
const ServicesPage = lazy(() => import("@/pages/services/services.page"));
const PricingPage = lazy(() => import("@/pages/pricing/pricing.page"));
const AboutPage = lazy(() => import("@/pages/about/about.page"));
const ContactPage = lazy(() => import("@/pages/contact/contact.page"));
const AdminDashboard = lazy(() => import("@/pages/admin/admin.page"));
const ProfilePage = lazy(() => import("@/pages/profile/profile.page"));
const CustomersPage = lazy(() => import("@/pages/admin/customers/customers.page"));
const ProductsPage = lazy(() => import("@/pages/admin/components/products-manager/products.page"));

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
          <Route path={ROUTER_PAGE.admin} element={<AdminDashboard />}>
            <Route path="product" element={<ProductsPage />} />
            <Route path="unit-managerment" element={<CustomersPage />} />
            <Route path="user-managerment" element={<CustomersPage />} />
            <Route path="appoinment-managerment" element={<CustomersPage />} />
          </Route>
          <Route path={ROUTER_PAGE.profile} element={<ProfilePage />} />
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
