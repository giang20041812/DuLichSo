import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const readPortalSession = () => {
  try {
    const raw = localStorage.getItem('portal_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Ngăn Admin và Provider truy cập trang của khách hàng
 * Chuyển hướng về admin dashboard hoặc provider dashboard.
 */
export default function CustomerRoute() {
  const navigate = useNavigate();
  const [session] = useState(readPortalSession);

  useEffect(() => {
    if (session) {
      if (session.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (session.role === 'PROVIDER') {
        navigate('/partner', { replace: true });
      }
    }
  }, [session, navigate]);

  if (session && (session.role === 'ADMIN' || session.role === 'PROVIDER')) {
    return null;
  }

  return <Outlet />;
}
