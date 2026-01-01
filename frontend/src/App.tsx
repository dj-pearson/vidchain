import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout, AuthLayout, PublicLayout, AdminLayout } from '@/components/layout';
import { ROUTES } from '@/config/constants';
import { Web3Provider } from '@/lib/web3';
import { ToastProvider, SkipLink } from '@/components/ui';

// Critical pages loaded synchronously for fast initial render
import { Login, Signup, Dashboard } from '@/pages';

// Lazy-loaded pages for code splitting
const Upload = lazy(() => import('@/pages/Upload').then(m => ({ default: m.Upload })));
const Videos = lazy(() => import('@/pages/Videos').then(m => ({ default: m.Videos })));
const VideoDetail = lazy(() => import('@/pages/VideoDetail').then(m => ({ default: m.VideoDetail })));
const Verify = lazy(() => import('@/pages/Verify').then(m => ({ default: m.Verify })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const Organization = lazy(() => import('@/pages/Organization').then(m => ({ default: m.Organization })));
const ApiKeys = lazy(() => import('@/pages/ApiKeys').then(m => ({ default: m.ApiKeys })));
const Billing = lazy(() => import('@/pages/Billing').then(m => ({ default: m.Billing })));
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const HowItWorks = lazy(() => import('@/pages/HowItWorks').then(m => ({ default: m.HowItWorks })));
const Pricing = lazy(() => import('@/pages/Pricing').then(m => ({ default: m.Pricing })));
const Marketplace = lazy(() => import('@/pages/marketplace/Marketplace').then(m => ({ default: m.Marketplace })));
const NFTDetail = lazy(() => import('@/pages/marketplace/NFTDetail').then(m => ({ default: m.NFTDetail })));
const MyListings = lazy(() => import('@/pages/marketplace/MyListings').then(m => ({ default: m.MyListings })));
const Wallet = lazy(() => import('@/pages/marketplace/Wallet').then(m => ({ default: m.Wallet })));
const DMCASubmit = lazy(() => import('@/pages/dmca/DMCASubmit').then(m => ({ default: m.DMCASubmit })));

// Lazy-loaded admin pages
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminContent = lazy(() => import('@/pages/admin/AdminContent').then(m => ({ default: m.AdminContent })));
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration').then(m => ({ default: m.AdminModeration })));
const AdminMarketplace = lazy(() => import('@/pages/admin/AdminMarketplace').then(m => ({ default: m.AdminMarketplace })));
const AdminFinance = lazy(() => import('@/pages/admin/AdminFinance').then(m => ({ default: m.AdminFinance })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}


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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </Web3Provider>
    </ToastProvider>
  );
}

export default App;
