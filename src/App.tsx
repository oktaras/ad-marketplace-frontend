import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { RoleProvider, useRole } from '@/contexts/RoleContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AppProviders } from '@/app/providers/AppProviders';
import { TelegramBackButton } from '@/app/router/TelegramBackButton';
import { TelegramSettingsButton } from '@/app/router/TelegramSettingsButton';

// Pages
import Home from '@/pages/Home';
import Briefs from '@/pages/Briefs';
import Listings from '@/pages/Listings';
import MyStuff from '@/pages/MyStuff';
import MyChannels from '@/pages/MyChannels';
import MyBriefs from '@/pages/MyBriefs';
import Deals from '@/pages/Deals';
import Profile from '@/pages/Profile';
import Onboarding from '@/pages/Onboarding';
import NotFound from '@/pages/NotFound';

function AppRoutes() {
  const { hasCompletedOnboarding } = useRole();

  if (!hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/briefs" element={<Briefs />} />
      <Route path="/listings" element={<Listings />} />
      <Route path="/channels" element={<Navigate to="/listings" replace />} />
      <Route path="/my-stuff" element={<MyStuff />} />
      <Route path="/my-channels" element={<MyChannels />} />
      <Route path="/my-briefs" element={<MyBriefs />} />
      <Route path="/deals" element={<Deals />} />
      <Route path="/deals/:id" element={<Deals />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProviders>
      <TooltipProvider>
        <BrowserRouter>
          <LanguageProvider>
            <RoleProvider>
              <TelegramBackButton />
              <TelegramSettingsButton />
              <AppRoutes />
              <Toaster />
            </RoleProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AppProviders>
  );
}

export default App;
