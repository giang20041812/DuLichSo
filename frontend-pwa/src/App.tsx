import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from '@/components/layout/ScrollToTop';
import AppRoutes from '@/routes';
import { PwaBanner } from '@/components/pwa/PwaBanner';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
      <PwaBanner />
    </BrowserRouter>
  );
}

export default App;
