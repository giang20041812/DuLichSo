import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentCustomer } from '@/services/authService';

/** Bảo vệ các màn hình chỉ dành cho khách du lịch và giữ lại URL trước đăng nhập. */
export default function TravelerRoute() {
  const location = useLocation();
  const customer = getCurrentCustomer();

  if (!customer) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnUrl: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (customer.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (customer.role === 'PROVIDER') return <Navigate to="/partner" replace />;
  return <Outlet />;
}
