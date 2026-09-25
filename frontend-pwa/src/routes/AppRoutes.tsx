import { Routes, Route } from 'react-router-dom';
import SidebarLayout from '@/components/layout/SidebarLayout';
import PartnerLayout from '@/components/partner/PartnerLayout';
import PartnerRoomsPage from '@/pages/partner/PartnerRoomsPage';
import PartnerBookingProcessPage from '@/pages/partner/PartnerBookingProcessPage';
import PartnerReviewsPage from '@/pages/partner/PartnerReviewsPage';
import ProviderRegisterPage from '@/pages/auth/ProviderRegisterPage';
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
  RegisterPage,
  ProviderSuspendedPage,
  AdminDashboardPage,
  PartnerDashboardPage,
  PartnerBookingsPage,
  PartnerHomestayDetailPage,
  PartnerHomestayEditPage,
  DesignSystemPage,
} from '@/pages';

export function AppRoutes() {
  return (
    <Routes>
      {/* Khung ứng dụng chính với Sidebar Layout */}
      <Route element={<SidebarLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Navigation via Sidebar */}
        <Route path="homestays" element={<HomestayListPage />} />
        <Route path="homestays/:id" element={<HomestayDetailPage />} />
        
        <Route path="experiences" element={<CultureFestivalPage />} />
        <Route path="destinations" element={<DestinationListPage />} />
        <Route path="restaurants" element={<RestaurantListPage />} />
        
        {/* Profile / Other standard layout pages */}
        <Route path="profile" element={<UtilityListPage />} /> {/* Placeholder for now */}
        
        {/* Keep existing routes but map them properly or leave for later phases */}
        <Route path="culture" element={<CultureFestivalPage />} />
        <Route path="explore" element={<CultureFestivalPage />} />
        <Route path="food" element={<RestaurantListPage />} />
        <Route path="tours" element={<CultureFestivalPage />} />
        <Route path="transport" element={<TransportListPage />} />
        <Route path="services" element={<UtilityListPage />} />
        <Route path="photo" element={<UtilityListPage />} />
        <Route path="rental" element={<UtilityListPage />} />
        <Route path="design-system" element={<DesignSystemPage />} />
      </Route>

      {/* Trang Đặt phòng dùng layout độc lập, chỉ có Logo và Tên */}
      <Route path="booking" element={<BookingPage />} />

      {/* Dedicated Homestay, Room Availability & Fullscreen Map Routes (No Sidebar for fullscreen) */}
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
      <Route path="register" element={<RegisterPage />} />
      <Route path="register/partner" element={<ProviderRegisterPage />} />
      <Route path="portal/suspended" element={<ProviderSuspendedPage />} />
      <Route path="admin" element={<AdminDashboardPage />} />
      <Route element={<PartnerLayout />}>
        <Route path="partner" element={<PartnerDashboardPage />} />
        <Route path="partner/bookings" element={<PartnerBookingsPage />} />
        <Route path="partner/bookings/:id" element={<PartnerBookingProcessPage />} />
        <Route path="partner/reviews" element={<PartnerReviewsPage />} />
        <Route path="partner/homestays" element={<PartnerDashboardPage />} />
        <Route path="partner/homestay/create" element={<PartnerHomestayEditPage />} />
        <Route path="partner/homestay/:id" element={<PartnerHomestayDetailPage />} />
        <Route path="partner/homestay/:id/edit" element={<PartnerHomestayEditPage />} />
        <Route path="partner/homestay/:id/rooms" element={<PartnerRoomsPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
