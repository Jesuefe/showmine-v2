import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initAdMob } from './services/admob';
import { initPushNotifications } from './services/notifications';
import { registerDevice } from './services/device';
import { AuthProvider, useAuth } from './context/AuthContext';
import { KidsProvider, KidsGuard } from './context/KidsContext';
import { SupportProvider } from './context/SupportContext';
import { SupportList, SupportThread } from './pages/Support';
import { I18nProvider } from './i18n/I18nContext';
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
import LaunchIntro from './components/LaunchIntro';
import Watchlist from './pages/Watchlist';
import ContinueWatching from './pages/ContinueWatching';
import Downloads from './pages/Downloads';
import OfflineGate from './components/OfflineGate';
import ComingSoon from './pages/ComingSoon';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';
import Terms from './pages/Terms';
import Kids from './pages/Kids';
import DataUsage from './pages/DataUsage';
import Sessions from './pages/Sessions';
import KidsSetup from './pages/KidsSetup';
import TVLogin from './pages/TVLogin';
import ScanLogin from './pages/ScanLogin';
import Continue from './pages/Continue';
import SubscribeVerify from './pages/SubscribeVerify';
import Privacy from './pages/Privacy';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import DeleteAccount from './pages/DeleteAccount';
import Shorts from './pages/Shorts';

function PL({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdMobInitializer() {
  useEffect(() => { initAdMob(); }, []);
  return null;
}

function PushNotificationInitializer() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.id) { initPushNotifications(user.id); registerDevice(); }
  }, [user?.id]);
  return null;
}

function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;
    import('@capacitor/app').then((mod) => {
      mod.App.addListener('appUrlOpen', (event) => {
        try {
          const url = new URL(event.url);
          const path = url.pathname;
          if (path) navigate(path + url.search);
        } catch (e) {}
      });
    }).catch(() => {});
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <AdMobInitializer />
      <BrowserRouter>
        <LaunchIntro />
        <DeepLinkHandler />
        <OfflineGate />
        <I18nProvider>
          <AuthProvider>
           <KidsProvider>
           <SupportProvider>
            <PushNotificationInitializer />
            <KidsGuard />
            <Routes>
              <Route path="/login"            element={<Login />} />
              <Route path="/register"         element={<Register />} />
              <Route path="/onboarding"       element={<Onboarding />} />
              <Route path="/forgot-password"  element={<ForgotPassword />} />
              <Route path="/delete-account"   element={<DeleteAccount />} />
              <Route path="/settings"         element={<PL><Settings /></PL>} />
              <Route path="/support"          element={<PL><SupportList /></PL>} />
              <Route path="/support/:id"      element={<PL><SupportThread /></PL>} />
              <Route path="/shorts"           element={<PL><Shorts /></PL>} />
              <Route path="/"                 element={<PL><Home /></PL>} />
              <Route path="/browse"           element={<PL><Browse /></PL>} />
              <Route path="/watch/:slug"      element={<PL><Watch /></PL>} />
              <Route path="/live"             element={<PL><Live /></PL>} />
              <Route path="/search"           element={<PL><Search /></PL>} />
              <Route path="/profile"          element={<PL><Profile /></PL>} />
              <Route path="/subscribe"        element={<PL><Subscribe /></PL>} />
              <Route path="/watchlist"        element={<PL><Watchlist /></PL>} />
              <Route path="/continue-watching" element={<PL><ContinueWatching /></PL>} />
              <Route path="/downloads"        element={<PL><Downloads /></PL>} />
              <Route path="/coming-soon"      element={<PL><ComingSoon /></PL>} />
              <Route path="/subscribe/verify" element={<SubscribeVerify />} />
              <Route path="/tv-login"         element={<TVLogin />} />
              <Route path="/scan-login"       element={<ScanLogin />} />
              <Route path="/continue"         element={<Continue />} />
              <Route path="/sessions"         element={<PL><Sessions /></PL>} />
              <Route path="/data-usage"       element={<PL><DataUsage /></PL>} />
              <Route path="/kids"             element={<PL><Kids /></PL>} />
              <Route path="/kids-setup"       element={<PL><KidsSetup /></PL>} />
              <Route path="/terms"            element={<Terms />} />
              <Route path="/privacy"          element={<Privacy />} />
              <Route path="*"                 element={<NotFound />} />
            </Routes>
           </SupportProvider>
           </KidsProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </>
  );
}



