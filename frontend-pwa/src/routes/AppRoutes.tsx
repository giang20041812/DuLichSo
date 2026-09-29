import { Routes, Route } from 'react-router-dom';
import SidebarLayout from '@/components/layout/SidebarLayout';
import CustomerRoute from '@/components/layout/CustomerRoute';
import TravelerRoute from '@/components/layout/TravelerRoute';
import PartnerLayout from '@/components/partner/PartnerLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import PartnerRoomsPage from '@/pages/partner/PartnerRoomsPage';
import PartnerBookingProcessPage from '@/pages/partner/PartnerBookingProcessPage';
import PartnerReviewsPage from '@/pages/partner/PartnerReviewsPage';
import ProviderRegisterPage from '@/pages/auth/ProviderRegisterPage';
import {
  HomePage,
  HomestayListPage,
  HomestayDetailPage,
  FullScreenMapPage,
  BookingPage,
  UserBookingListPage,
  UserBookingDetailPage,
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
  PartnerHomestaysPage,
  PartnerBookingsPage,
  PartnerHomestayEditPage,
  DesignSystemPage,
  DownloadAppPage,
  PartnerProfilePage,
} from '@/pages';

export function AppRoutes() {
  return (
    <Routes>
      {/* Wrap all customer pages in CustomerRoute */}
      <Route element={<CustomerRoute />}>
        {/* Khung ứng dụng chính với Sidebar Layout */}
        <Route element={<SidebarLayout />}>
          <Route index element={<HomePage />} />
          
          {/* Navigation via Sidebar */}
          <Route path="homestays" element={<HomestayListPage />} />
          <Route path="homestays/:id" element={<HomestayDetailPage />} />
          
          {/* User Bookings Management */}
          <Route element={<TravelerRoute />}>
            <Route path="bookings" element={<UserBookingListPage />} />
            <Route path="my-bookings" element={<UserBookingListPage />} />
            <Route path="bookings/:bookingCode" element={<UserBookingDetailPage />} />
          </Route>
          
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
          <Route path="download" element={<DownloadAppPage />} />
          <Route path="tai-app" element={<DownloadAppPage />} />
          <Route path="cai-dat-app" element={<DownloadAppPage />} />
        </Route>

        {/* Trang Đặt phòng dùng layout độc lập, chỉ có Logo và Tên */}
        <Route path="booking" element={<BookingPage />} />

        {/* Dedicated Homestay, Room Availability & Fullscreen Map Routes (No Sidebar for fullscreen) */}
        <Route path="homestay/:slug/map" element={<FullScreenMapPage />} />
        <Route path="map" element={<FullScreenMapPage />} />
      </Route>

      {/* UC-08 & UC-10: Admin & NCC Partner Portal Login, Dashboards & Homestay Management */}
      <Route path="admin/login" element={<PortalLoginPage />} />
      <Route path="portal/login" element={<PortalLoginPage />} />
      <Route path="login" element={<PortalLoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="register/partner" element={<ProviderRegisterPage />} />
      <Route path="portal/suspended" element={<ProviderSuspendedPage />} />
      <Route
        path="admin"
        element={
          <AdminGuard>
            <AdminDashboardPage />
          </AdminGuard>
        }
      />
      <Route element={<PartnerLayout />}>
        <Route path="partner" element={<PartnerDashboardPage />} />
        <Route path="partner/homestays" element={<PartnerHomestaysPage />} />
        <Route path="partner/bookings" element={<PartnerBookingsPage />} />
        <Route path="partner/bookings/:id" element={<PartnerBookingProcessPage />} />
        <Route path="partner/reviews" element={<PartnerReviewsPage />} />
        <Route path="partner/homestay/create" element={<PartnerHomestayEditPage />} />
        <Route path="partner/homestay/:id/edit" element={<PartnerHomestayEditPage />} />
        <Route path="partner/homestay/:id/rooms" element={<PartnerRoomsPage />} />
        <Route path="partner/profile" element={<PartnerProfilePage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
