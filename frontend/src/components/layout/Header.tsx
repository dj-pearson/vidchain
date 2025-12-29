import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { WalletButton } from '@/components/wallet';
import { ROUTES } from '@/config/constants';
import {
  Shield,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Upload,
  Video,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu toggle */}
        {isAuthenticated && (
          <button
            onClick={onMenuToggle}
            className="mr-4 p-2 lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}

        {/* Logo */}
        <Link to={isAuthenticated ? ROUTES.dashboard : ROUTES.home} className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">VidChain</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="ml-8 hidden items-center gap-6 lg:flex">
            <Link
              to={ROUTES.dashboard}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to={ROUTES.upload}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            <Link
              to={ROUTES.videos}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Video className="h-4 w-4" />
              Videos
            </Link>
            <Link
              to={ROUTES.verify}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCircle className="h-4 w-4" />
              Verify
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Wallet connection button */}
          <WalletButton showBalance={true} chainStatus="icon" />

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full p-2 hover:bg-accent min-h-[44px] min-w-[44px]"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden text-sm font-medium md:block">
                  {profile?.full_name || profile?.email || 'User'}
                </span>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 sm:w-56 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-1 shadow-lg">
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {profile?.email}
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link
                      to={ROUTES.settings}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to={ROUTES.login}>
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to={ROUTES.signup}>
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
