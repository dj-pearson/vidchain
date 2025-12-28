import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import {
  LayoutDashboard,
  Upload,
  Video,
  CheckCircle,
  Settings,
  Key,
  CreditCard,
  Building,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: 'Upload',
    href: ROUTES.upload,
    icon: Upload,
  },
  {
    title: 'Videos',
    href: ROUTES.videos,
    icon: Video,
  },
  {
    title: 'Verify',
    href: ROUTES.verify,
    icon: CheckCircle,
  },
];

const settingsNavItems = [
  {
    title: 'General',
    href: ROUTES.settings,
    icon: Settings,
  },
  {
    title: 'API Keys',
    href: ROUTES.apiKeys,
    icon: Key,
  },
  {
    title: 'Billing',
    href: ROUTES.billing,
    icon: CreditCard,
  },
  {
    title: 'Organization',
    href: ROUTES.organization,
    icon: Building,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          {/* Main navigation */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Settings section */}
          <div className="mt-8">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </h3>
            <nav className="space-y-1">
              {settingsNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Help section */}
          <div className="mt-auto border-t pt-4">
            <a
              href="https://docs.vidchain.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              Documentation
            </a>
            <a
              href="https://vidchain.io/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              Support
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
