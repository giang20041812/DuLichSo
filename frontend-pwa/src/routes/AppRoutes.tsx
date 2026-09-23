import { Routes, Route } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import {
  HomePage,
  HomestayListPage,
  HomestayDetailPage,
  RoomAvailabilityPage,
  FullScreenMapPage,
  BookingPage,
  ExperienceDetailPage,
  CultureFestivalPage,
  DestinationListPage,
  RestaurantListPage,
  TransportListPage,
  UtilityListPage,
  PortalLoginPage,
  AdminDashboardPage,
  PartnerDashboardPage,
  PartnerHomestayDetailPage,
  PartnerHomestayEditPage,
  DesignSystemPage,
} from '@/pages';

export function AppRoutes() {
  return (
    <Routes>
      {/* Khung ứng dụng chính với Navbar, SubNav, Footer và Bottom Nav */}
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="culture" element={<CultureFestivalPage />} />
        <Route path="explore" element={<CultureFestivalPage />} />
        <Route path="homestays" element={<HomestayListPage />} />
        <Route path="homestays/:id" element={<HomestayDetailPage />} />
        <Route path="restaurants" element={<RestaurantListPage />} />
        <Route path="food" element={<RestaurantListPage />} />
        <Route path="destinations" element={<DestinationListPage />} />
        <Route path="transport" element={<TransportListPage />} />
        <Route path="services" element={<UtilityListPage />} />
        <Route path="photo" element={<UtilityListPage />} />
        <Route path="rental" element={<UtilityListPage />} />
        <Route path="design-system" element={<DesignSystemPage />} />
      </Route>

      {/* Trang Đặt phòng dùng layout độc lập, chỉ có Logo và Tên */}
      <Route path="booking" element={<BookingPage />} />

      {/* Dedicated Homestay, Room Availability & Fullscreen Map Routes */}
      <Route path="homestay" element={<HomestayDetailPage />} />
      <Route path="homestay/:slug" element={<HomestayDetailPage />} />
      <Route path="homestay/:slug/availability" element={<RoomAvailabilityPage />} />
      <Route path="homestay/:slug/check-rooms" element={<RoomAvailabilityPage />} />
      <Route path="homestay/:slug/map" element={<FullScreenMapPage />} />
      <Route path="map" element={<FullScreenMapPage />} />

      {/* Local Cultural Experience Routes */}
      <Route path="experience" element={<ExperienceDetailPage />} />
      <Route path="experience/:slug" element={<ExperienceDetailPage />} />
      <Route path="trai-nghiem/:slug" element={<ExperienceDetailPage />} />

      {/* UC-08 & UC-10: Admin & NCC Partner Portal Login, Dashboards & Homestay Management */}
      <Route path="admin/login" element={<PortalLoginPage />} />
      <Route path="portal/login" element={<PortalLoginPage />} />
      <Route path="login" element={<PortalLoginPage />} />
      <Route path="admin" element={<AdminDashboardPage />} />
      <Route path="partner" element={<PartnerDashboardPage />} />
      <Route path="partner/homestays" element={<PartnerDashboardPage />} />
      <Route path="partner/homestay/create" element={<PartnerHomestayEditPage />} />
      <Route path="partner/homestay/:id" element={<PartnerHomestayDetailPage />} />
      <Route path="partner/homestay/:id/edit" element={<PartnerHomestayEditPage />} />
    </Routes>
  );
}

export default AppRoutes;
