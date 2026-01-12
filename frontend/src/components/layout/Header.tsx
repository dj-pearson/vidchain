import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LazyWalletButton } from '@/components/wallet/LazyWalletButton';
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
import { useState, useRef, useEffect, useCallback } from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { isAuthenticated, profile, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  // Close menu on Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isUserMenuOpen) {
      setIsUserMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [isUserMenuOpen]);

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!menuRef.current) return;

    const focusableItems = menuRef.current.querySelectorAll<HTMLElement>(
      'a, button'
    );
    const currentIndex = Array.from(focusableItems).indexOf(
      document.activeElement as HTMLElement
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableItems.length;
        focusableItems[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? focusableItems.length - 1 : currentIndex - 1;
        focusableItems[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        focusableItems[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        focusableItems[focusableItems.length - 1]?.focus();
        break;
      case 'Tab':
        // Close menu when tabbing out
        setIsUserMenuOpen(false);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isUserMenuOpen && firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu toggle */}
        {isAuthenticated && (
          <button
            onClick={onMenuToggle}
            className="mr-4 p-2 lg:hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isSidebarOpen}
            aria-controls="mobile-navigation"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        )}

        {/* Logo */}
        <Link
          to={isAuthenticated ? ROUTES.dashboard : ROUTES.home}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
          aria-label="VidChain - Go to homepage"
        >
          <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold">VidChain</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav
            className="ml-8 hidden items-center gap-6 lg:flex"
            aria-label="Main navigation"
          >
            <Link
              to={ROUTES.dashboard}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Dashboard
            </Link>
            <Link
              to={ROUTES.upload}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload
            </Link>
            <Link
              to={ROUTES.videos}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
            >
              <Video className="h-4 w-4" aria-hidden="true" />
              Videos
            </Link>
            <Link
              to={ROUTES.verify}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              Verify
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Wallet connection button - lazy loaded for better initial page load */}
          <LazyWalletButton showBalance={true} chainStatus="icon" />

          {isAuthenticated ? (
            <div className="relative">
              <button
                ref={menuButtonRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full p-2 hover:bg-accent min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-controls="user-menu"
                id="user-menu-button"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" aria-hidden="true" />
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
                    aria-hidden="true"
                  />
                  <div
                    ref={menuRef}
                    id="user-menu"
                    role="menu"
                    aria-labelledby="user-menu-button"
                    aria-orientation="vertical"
                    className="absolute right-0 top-full z-50 mt-2 w-48 sm:w-56 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-1 shadow-lg"
                    onKeyDown={handleMenuKeyDown}
                  >
                    <div className="px-3 py-2 text-sm text-muted-foreground" role="none">
                      <span className="sr-only">Signed in as </span>
                      {profile?.email}
                    </div>
                    <div className="my-1 h-px bg-border" role="separator" aria-hidden="true" />
                    <Link
                      ref={firstMenuItemRef}
                      to={ROUTES.settings}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent focus:bg-accent focus:outline-none"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
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
