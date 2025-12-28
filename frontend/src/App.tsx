import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout, AuthLayout, PublicLayout } from '@/components/layout';
import { Dashboard, Upload, Videos, VideoDetail, Verify, Settings, ApiKeys, Billing, Login, Signup } from '@/pages';
import { ROUTES } from '@/config/constants';
import { Web3Provider } from '@/lib/web3';

// Home page component
function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold">VidChain</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Video Authenticity Verification Platform
        </p>
        <p className="mt-2 text-muted-foreground">
          Protect your video content with blockchain-verified provenance
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href={ROUTES.signup}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href={ROUTES.verify}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium hover:bg-accent"
          >
            Verify a Video
          </a>
        </div>
      </div>
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
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.verify} element={<Verify />} />
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
            <Route path={ROUTES.organization} element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
