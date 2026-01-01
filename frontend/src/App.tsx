import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout, AuthLayout, PublicLayout, AdminLayout } from '@/components/layout';
import {
  Dashboard,
  Upload,
  Videos,
  VideoDetail,
  Verify,
  Settings,
  Organization,
  ApiKeys,
  Billing,
  Login,
  Signup,
  HomePage,
  HowItWorks,
  Pricing,
  Marketplace,
  NFTDetail,
  MyListings,
  Wallet,
} from '@/pages';
import {
  AdminOverview,
  AdminUsers,
  AdminContent,
  AdminModeration,
  AdminMarketplace,
  AdminFinance,
} from '@/pages/admin';
import { DMCASubmit } from '@/pages/dmca';
import { ROUTES } from '@/config/constants';
import { Web3Provider } from '@/lib/web3';
import { ToastProvider, SkipLink } from '@/components/ui';


// 404 page
function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
      <a
        href={ROUTES.home}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go Home
      </a>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Web3Provider>
        <BrowserRouter>
          <SkipLink />
          <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.verify} element={<Verify />} />
            <Route path={ROUTES.howItWorks} element={<HowItWorks />} />
            <Route path={ROUTES.pricing} element={<Pricing />} />
            <Route path={ROUTES.marketplace} element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<NFTDetail />} />
            {/* DMCA routes (public) */}
            <Route path={ROUTES.dmcaSubmit} element={<DMCASubmit />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.login} element={<Login />} />
            <Route path={ROUTES.signup} element={<Signup />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
            <Route path={ROUTES.upload} element={<Upload />} />
            <Route path={ROUTES.videos} element={<Videos />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path={ROUTES.settings} element={<Settings />} />
            <Route path={ROUTES.apiKeys} element={<ApiKeys />} />
            <Route path={ROUTES.billing} element={<Billing />} />
            <Route path={ROUTES.organization} element={<Organization />} />
            {/* Marketplace routes (protected) */}
            <Route path={ROUTES.myListings} element={<MyListings />} />
            <Route path={ROUTES.wallet} element={<Wallet />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.adminDashboard} element={<AdminOverview />} />
            <Route path={ROUTES.adminUsers} element={<AdminUsers />} />
            <Route path={ROUTES.adminContent} element={<AdminContent />} />
            <Route path={ROUTES.adminModeration} element={<AdminModeration />} />
            <Route path={ROUTES.adminMarketplace} element={<AdminMarketplace />} />
            <Route path={ROUTES.adminFinance} element={<AdminFinance />} />
          </Route>
          </Routes>
        </BrowserRouter>
      </Web3Provider>
    </ToastProvider>
  );
}

export default App;
