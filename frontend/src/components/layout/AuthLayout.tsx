import { Outlet, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useRedirectAuthenticated } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/Spinner';
import { ROUTES } from '@/config/constants';

export function AuthLayout() {
  const { isLoading } = useRedirectAuthenticated();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between p-12">
        <Link to={ROUTES.home} className="flex items-center gap-2 text-primary-foreground">
          <Shield className="h-10 w-10" />
          <span className="text-2xl font-bold">VidChain</span>
        </Link>

        <div className="space-y-6 text-primary-foreground">
          <h1 className="text-4xl font-bold">
            Video Authenticity Verification
          </h1>
          <p className="text-lg opacity-90">
            Protect your content with blockchain-verified provenance.
            Trusted by news organizations worldwide.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <span className="text-xl">1</span>
              </div>
              <span>Upload your video content</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <span className="text-xl">2</span>
              </div>
              <span>Generate cryptographic verification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <span className="text-xl">3</span>
              </div>
              <span>Share verified content with confidence</span>
            </div>
          </div>
        </div>

        <p className="text-sm opacity-75 text-primary-foreground">
          &copy; {new Date().getFullYear()} VidChain. Powered by Polygon blockchain.
        </p>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link to={ROUTES.home} className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">VidChain</span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
