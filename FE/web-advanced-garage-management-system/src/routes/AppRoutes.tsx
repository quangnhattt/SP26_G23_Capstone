import Splash from "@/components/layout/AuthLayout/Splash";
import useAuth from "@/hooks/useAuth";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { ROUTER_PAGE } from "./contants";
import { lazy, Suspense } from "react";
import UserPage from "@/pages/admin/components/user-manager/user.page";
import ServicePage from "@/pages/admin/components/service-manager/service.page";
import CategoryPage from "@/pages/admin/components/category-manager/category.page";
import SupplierPage from "@/pages/admin/components/supplier-manager/supplier.page";
import UnitPage from "@/pages/admin/components/unit-manager/unit.page";
import ManagermentAppointment from "@/pages/admin/components/appointment-manager/ManagermentAppointment";

const HomePage = lazy(() => import("@/pages/home/home.page"));
const ServicesPageHome = lazy(() => import("@/pages/services/services.page.home"));
const PricingPage = lazy(() => import("@/pages/pricing/pricing.page"));
const AboutPage = lazy(() => import("@/pages/about/about.page"));
const ContactPage = lazy(() => import("@/pages/contact/contact.page"));
const BookingPage = lazy(() => import("@/pages/booking/booking.page"));
const RescuePage = lazy(() => import("@/pages/booking/rescue.page"));
const AppointmentsPage = lazy(() => import("@/pages/appointments/appointments.page"));
const AdminDashboard = lazy(() => import("@/pages/admin/admin.page"));
const ProfilePage = lazy(() => import("@/pages/profile/profile.page"));
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
          <Route path={ROUTER_PAGE.services} element={<ServicesPageHome />} />
          <Route path={ROUTER_PAGE.pricing} element={<PricingPage />} />
          <Route path={ROUTER_PAGE.about} element={<AboutPage />} />
          <Route path={ROUTER_PAGE.contact} element={<ContactPage />} />
          <Route path={ROUTER_PAGE.booking} element={<BookingPage />} />
          <Route path={ROUTER_PAGE.rescue} element={<RescuePage />} />
          <Route path={ROUTER_PAGE.appointments} element={<AppointmentsPage />} />
          <Route path={ROUTER_PAGE.admin} element={<AdminDashboard />}>
            <Route path="product" element={<ProductsPage />} />
            <Route path="unit-managerment" element={<UnitPage />} />
            <Route path="user-managerment" element={<UserPage />} />
            <Route path="appoinment-managerment" element={<ManagermentAppointment />} />
            <Route path="category" element={<CategoryPage />} />
            <Route path="service" element={<ServicePage />} />
            <Route path="supplier" element={<SupplierPage />} />

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
