import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DesignSystemPage from './pages/DesignSystemPage'
import AppShell from './components/layout/AppShell'

import HomestayListPage from './pages/HomestayListPage'
import HomestayDetailPage from './pages/HomestayDetailPage'
import BookingPage from './pages/BookingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="homestays" element={<HomestayListPage />} />
          <Route path="homestays/:id" element={<HomestayDetailPage />} />
          <Route path="design-system" element={<DesignSystemPage />} />
        </Route>
        {/* Trang Đặt phòng dùng layout độc lập, chỉ có Logo và Tên */}
        <Route path="booking" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
