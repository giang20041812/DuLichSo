import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DesignSystemPage from './pages/DesignSystemPage'
import HomestayDetailPage from './pages/HomestayDetailPage'
import FullScreenMapPage from './pages/FullScreenMapPage'
import RoomAvailabilityPage from './pages/RoomAvailabilityPage'
import ExperienceDetailPage from './pages/ExperienceDetailPage'
import AppShell from './components/layout/AppShell'

import HomestayListPage from './pages/HomestayListPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="homestays" element={<HomestayListPage />} />
          <Route path="design-system" element={<DesignSystemPage />} />
        </Route>

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
