import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DesignSystemPage from './pages/DesignSystemPage'
import HomestayDetailPage from './pages/HomestayDetailPage'
import FullScreenMapPage from './pages/FullScreenMapPage'
import AppShell from './components/layout/AppShell'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="design-system" element={<DesignSystemPage />} />
        </Route>

        {/* Dedicated Homestay & Fullscreen Map Routes */}
        <Route path="homestay" element={<HomestayDetailPage />} />
        <Route path="homestay/:slug" element={<HomestayDetailPage />} />
        <Route path="homestay/:slug/map" element={<FullScreenMapPage />} />
        <Route path="map" element={<FullScreenMapPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
