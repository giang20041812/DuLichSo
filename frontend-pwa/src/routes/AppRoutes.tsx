import { Routes, Route } from 'react-router-dom';
import SidebarLayout from '@/components/layout/SidebarLayout';
import PartnerLayout from '@/components/partner/PartnerLayout';
import {
  HomePage,
  HomestayListPage,
  HomestayDetailPage,
  RoomAvailabilityPage,
  FullScreenMapPage,
  BookingPage,
  UserBookingListPage,
  UserBookingDetailPage,
  ExperienceDetailPage,
  CultureFestivalPage,
  FestivalDetailPage,
  DestinationListPage,
  PlaceDetailPage,
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
        
        {/* User Bookings Management */}
        <Route path="bookings" element={<UserBookingListPage />} />
        <Route path="my-bookings" element={<UserBookingListPage />} />
        <Route path="bookings/:bookingCode" element={<UserBookingDetailPage />} />
        
        <Route path="experiences" element={<CultureFestivalPage />} />
        <Route path="experiences/:slug" element={<FestivalDetailPage />} />
        <Route path="festivals/:slug" element={<FestivalDetailPage />} />
        <Route path="destinations" element={<DestinationListPage />} />
        <Route path="destinations/:identifier" element={<PlaceDetailPage />} />
        <Route path="places/:identifier" element={<PlaceDetailPage />} />
        <Route path="restaurants" element={<RestaurantListPage />} />
        <Route path="restaurants/:identifier" element={<PlaceDetailPage />} />
        
        {/* Profile / Other standard layout pages */}
        <Route path="profile" element={<UtilityListPage />} /> {/* Placeholder for now */}
        
        {/* Keep existing routes but map them properly or leave for later phases */}
        <Route path="culture" element={<CultureFestivalPage />} />
        <Route path="culture/:slug" element={<FestivalDetailPage />} />
        <Route path="explore" element={<CultureFestivalPage />} />
        <Route path="explore/:slug" element={<FestivalDetailPage />} />
        <Route path="food" element={<RestaurantListPage />} />
        <Route path="food/:identifier" element={<PlaceDetailPage />} />
        <Route path="tours" element={<CultureFestivalPage />} />
        <Route path="transport" element={<TransportListPage />} />
        <Route path="transport/:identifier" element={<PlaceDetailPage />} />
        <Route path="services" element={<UtilityListPage />} />
        <Route path="services/:identifier" element={<PlaceDetailPage />} />
        <Route path="photo" element={<UtilityListPage />} />
        <Route path="photo/:identifier" element={<PlaceDetailPage />} />
        <Route path="rental" element={<UtilityListPage />} />
        <Route path="rental/:identifier" element={<PlaceDetailPage />} />
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
      <Route path="portal/suspended" element={<ProviderSuspendedPage />} />
      <Route path="admin" element={<AdminDashboardPage />} />
      <Route element={<PartnerLayout />}>
        <Route path="partner" element={<PartnerDashboardPage />} />
        <Route path="partner/bookings" element={<PartnerBookingsPage />} />
        <Route path="partner/homestays" element={<PartnerDashboardPage />} />
        <Route path="partner/homestay/create" element={<PartnerHomestayEditPage />} />
        <Route path="partner/homestay/:id" element={<PartnerHomestayDetailPage />} />
        <Route path="partner/homestay/:id/edit" element={<PartnerHomestayEditPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
