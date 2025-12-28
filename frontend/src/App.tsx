import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, AuthLayout, PublicLayout } from '@/components/layout';
import { Dashboard, Upload, Videos, Verify, Settings, Login, Signup } from '@/pages';
import { ROUTES } from '@/config/constants';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
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
            <Route path="/videos/:id" element={<Videos />} />
            <Route path={ROUTES.settings} element={<Settings />} />
            <Route path={ROUTES.apiKeys} element={<Settings />} />
            <Route path={ROUTES.billing} element={<Settings />} />
            <Route path={ROUTES.organization} element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
