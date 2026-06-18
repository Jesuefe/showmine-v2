import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import Browse from './pages/Browse';
import Live from './pages/Live';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Subscribe from './pages/Subscribe';
import Watchlist from './pages/Watchlist';
import ComingSoon from './pages/ComingSoon';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import Terms from './pages/Terms';
import Kids from './pages/Kids';
import DataUsage from './pages/DataUsage';
import KidsSetup from './pages/KidsSetup';
import TVLogin from './pages/TVLogin';
import ScanLogin from './pages/ScanLogin';
import SubscribeVerify from './pages/SubscribeVerify';
import Privacy from './pages/Privacy';

function PL({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/onboarding"   element={<Onboarding />} />
          <Route path="/"             element={<PL><Home /></PL>} />
          <Route path="/browse"       element={<PL><Browse /></PL>} />
          <Route path="/watch/:slug"  element={<PL><Watch /></PL>} />
          <Route path="/live"         element={<PL><Live /></PL>} />
          <Route path="/search"       element={<PL><Search /></PL>} />
          <Route path="/profile"      element={<PL><Profile /></PL>} />
          <Route path="/subscribe"    element={<PL><Subscribe /></PL>} />
          <Route path="/watchlist"    element={<PL><Watchlist /></PL>} />
          <Route path="/coming-soon"  element={<PL><ComingSoon /></PL>} />
          <Route path="/subscribe/verify" element={<SubscribeVerify />} />
           <Route path="/tv-login"      element={<TVLogin />} />
           <Route path="/scan-login"    element={<ScanLogin />} />
           <Route path="/data-usage"   element={<PL><DataUsage /></PL>} />
           <Route path="/kids"          element={<PL><Kids /></PL>} />
           <Route path="/kids-setup"    element={<PL><KidsSetup /></PL>} />
           <Route path="/terms"             element={<Terms />} />
           <Route path="/privacy"       element={<Privacy />} />
           <Route path="*"             element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}