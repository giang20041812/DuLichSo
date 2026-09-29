import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from '@/components/layout/ScrollToTop';
import AppRoutes from '@/routes';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
