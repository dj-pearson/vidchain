import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import {
  LayoutDashboard,
  Users,
  Video,
  ShoppingBag,
  DollarSign,
  Shield,
  Settings,
  Flag,
  TrendingUp,
  Coins,
  FileText,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const adminNavItems = [
  {
    title: 'Overview',
    href: ROUTES.adminDashboard,
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: ROUTES.adminUsers,
    icon: Users,
  },
  {
    title: 'Content',
    href: ROUTES.adminContent,
    icon: Video,
  },
  {
    title: 'Moderation',
    href: ROUTES.adminModeration,
    icon: Flag,
  },
  {
    title: 'Marketplace',
    href: ROUTES.adminMarketplace,
    icon: ShoppingBag,
  },
  {
    title: 'Finance',
    href: ROUTES.adminFinance,
    icon: DollarSign,
  },
  {
    title: 'Tokens',
    href: ROUTES.adminTokens,
    icon: Coins,
  },
];

const systemNavItems = [
  {
    title: 'Analytics',
    href: ROUTES.adminAnalytics,
    icon: TrendingUp,
  },
  {
    title: 'Audit Logs',
    href: ROUTES.adminAuditLogs,
    icon: FileText,
  },
  {
    title: 'Settings',
    href: ROUTES.adminSettings,
    icon: Settings,
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
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
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-slate-900 transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          {/* Back to App */}
          <NavLink
            to={ROUTES.dashboard}
            className="mb-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </NavLink>

          {/* Admin Badge */}
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-red-500">Admin Panel</span>
          </div>

          {/* Main navigation */}
          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* System section */}
          <div className="mt-8">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              System
            </h3>
            <nav className="space-y-1">
              {systemNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* System Status */}
          <div className="mt-auto border-t border-slate-700 pt-4">
            <div className="rounded-lg bg-slate-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">System Status</span>
                <span className="flex items-center gap-1 text-sm text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400"></span>
                  Healthy
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Polygon RPC</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>IPFS Gateway</span>
                  <span className="text-green-400">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Database</span>
                  <span className="text-green-400">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
