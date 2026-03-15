import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/Select';
import { VisuallyHidden } from '@/components/ui/Accessibility';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import { useAdminUsers } from '@/hooks/useAdminData';
import {
  Search,
  MoreVertical,
  User,
  Shield,
  Ban,
  CheckCircle,
  Mail,
  Wallet,
  Eye,
  Edit,
  Trash2,
  Download,
  UserPlus,
  Loader2,
} from 'lucide-react';

type UserRole = 'all' | 'user' | 'organization_admin' | 'admin';
type UserStatus = 'all' | 'active' | 'suspended' | 'pending';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'organization_admin', label: 'Org Admin' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  wallet_address?: string;
  role: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const { data, isLoading } = useAdminUsers({
    search,
    roleFilter: roleFilter === 'all' ? undefined : roleFilter,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter,
    page,
    perPage: 20,
  });

  const users = (data?.users ?? []) as AdminUser[];
  const totalUsers = data?.total ?? 0;

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  // Close menu on Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && menuOpen) {
      const buttonRef = menuButtonRefs.current.get(menuOpen);
      setMenuOpen(null);
      buttonRef?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = (event: React.KeyboardEvent, _userId: string) => {
    const menu = menuRef.current;
    if (!menu) return;

    const focusableItems = menu.querySelectorAll<HTMLElement>('a, button');
    const currentIndex = Array.from(focusableItems).indexOf(
      document.activeElement as HTMLElement
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusableItems[(currentIndex + 1) % focusableItems.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusableItems[currentIndex <= 0 ? focusableItems.length - 1 : currentIndex - 1]?.focus();
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
        setMenuOpen(null);
        break;
    }
  };

  // Focus first menu item when menu opens
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLElement>('a, button');
      firstItem?.focus();
    }
  }, [menuOpen]);

  const getUserStatus = (user: AdminUser) => user.status || 'active';

  const renderUserMenu = (user: AdminUser, isMobile: boolean = false) => {
    const menuId = `user-menu-${user.id}`;
    const buttonId = `user-menu-button-${user.id}`;
    const displayName = user.full_name || user.email;
    const userStatus = getUserStatus(user);

    return (
      <div className="relative">
        <button
          ref={(el) => { if (el) menuButtonRefs.current.set(user.id, el); }}
          id={buttonId}
          onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
          className={`rounded p-2 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isMobile ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''
          }`}
          aria-label={`Actions for ${displayName}`}
          aria-expanded={menuOpen === user.id}
          aria-haspopup="menu"
          aria-controls={menuOpen === user.id ? menuId : undefined}
        >
          <MoreVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </button>

        {menuOpen === user.id && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(null)}
              aria-hidden="true"
            />
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-labelledby={buttonId}
              aria-orientation="vertical"
              className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg"
              onKeyDown={(e) => handleMenuKeyDown(e, user.id)}
            >
              <Link
                to={ROUTES.adminUser(user.id)}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
                onClick={() => setMenuOpen(null)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                View Details
              </Link>
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
                Edit User
              </button>
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Send Email
              </button>
              {userStatus === 'active' ? (
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-yellow-400 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Suspend User
                </button>
              ) : (
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-green-400 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
                >
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  Reactivate
                </button>
              )}
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-400 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete User
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const activeCount = users.filter((u) => getUserStatus(u) === 'active').length;
  const suspendedCount = users.filter((u) => getUserStatus(u) === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">
            {isLoading ? 'Loading...' : `${totalUsers} total users`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 flex-1 sm:flex-none" size="sm">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Export</span>
            <VisuallyHidden>Export users</VisuallyHidden>
          </Button>
          <Button className="flex-1 sm:flex-none" size="sm">
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden xs:inline">Add User</span>
            <VisuallyHidden>Add new user</VisuallyHidden>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4" role="region" aria-label="User statistics">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}
                </p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeCount}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-500" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : suspendedCount}
                </p>
                <p className="text-sm text-slate-400">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-500" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}
                </p>
                <p className="text-sm text-slate-400">Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="relative flex-1">
              <label htmlFor="user-search" className="sr-only">
                Search users
              </label>
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                id="user-search"
                placeholder="Search by email, name, or wallet..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-slate-900 border-slate-700 text-white"
                aria-label="Search users by email, name, or wallet address"
              />
            </div>

            <div className="flex gap-2">
              <div>
                <label htmlFor="role-filter" className="sr-only">
                  Filter by role
                </label>
                <NativeSelect
                  id="role-filter"
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value as UserRole); setPage(1); }}
                  options={ROLE_OPTIONS}
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>

              <div>
                <label htmlFor="status-filter" className="sr-only">
                  Filter by status
                </label>
                <NativeSelect
                  id="status-filter"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as UserStatus); setPage(1); }}
                  options={STATUS_OPTIONS}
                  className="border-slate-700 bg-slate-900 text-white"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div
              className="mt-4 flex items-center gap-4 rounded-lg bg-slate-900 p-3"
              role="region"
              aria-label="Bulk actions"
              aria-live="polite"
            >
              <span className="text-sm text-slate-400">
                {selectedUsers.length} selected
              </span>
              <Button size="sm" variant="outline" className="border-slate-600">
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                Email
              </Button>
              <Button size="sm" variant="outline" className="border-slate-600">
                <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                Suspend
              </Button>
              <Button size="sm" variant="outline" className="border-red-600 text-red-400">
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400">No users found</p>
          </CardContent>
        </Card>
      )}

      {/* Users Table - Desktop */}
      {!isLoading && users.length > 0 && (
        <Card className="hidden md:block bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <table
              className="w-full"
              role="table"
              aria-label="Users table"
            >
              <caption className="sr-only">
                List of users with their details, roles, status, and statistics.
                Use checkboxes to select users for bulk actions.
              </caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="p-4 text-left">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-600"
                        aria-label={selectedUsers.length === users.length ? 'Deselect all users' : 'Select all users'}
                      />
                      <span className="sr-only">Select all</span>
                    </label>
                  </th>
                  <th scope="col" className="p-4 text-left text-sm font-medium text-slate-400">User</th>
                  <th scope="col" className="p-4 text-left text-sm font-medium text-slate-400">Role</th>
                  <th scope="col" className="p-4 text-left text-sm font-medium text-slate-400">Status</th>
                  <th scope="col" className="p-4 text-left text-sm font-medium text-slate-400">Joined</th>
                  <th scope="col" className="p-4 text-left text-sm font-medium text-slate-400">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const displayName = user.full_name || user.email;
                  const userStatus = getUserStatus(user);

                  return (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="p-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                            className="rounded border-slate-600"
                            aria-label={`Select ${displayName}`}
                          />
                        </label>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                            <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{displayName}</span>
                            </div>
                            <p className="text-sm text-slate-500">{user.email}</p>
                            {user.wallet_address && (
                              <p className="flex items-center gap-1 text-xs text-slate-600">
                                <Wallet className="h-3 w-3" aria-hidden="true" />
                                <span className="sr-only">Wallet address: </span>
                                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'destructive'
                              : user.role === 'organization_admin'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {user.role === 'organization_admin' ? 'Org Admin' : user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {userStatus === 'active' ? (
                            <Badge className="bg-green-500/10 text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                              Active
                            </Badge>
                          ) : userStatus === 'suspended' ? (
                            <Badge className="bg-red-500/10 text-red-400">
                              <Ban className="mr-1 h-3 w-3" aria-hidden="true" />
                              Suspended
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-400">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-slate-300">
                            <span className="sr-only">Joined: </span>
                            {formatRelativeTime(user.created_at)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderUserMenu(user)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Users Cards - Mobile */}
      {!isLoading && users.length > 0 && (
        <div className="md:hidden space-y-4" role="list" aria-label="Users list">
          {users.map((user) => {
            const displayName = user.full_name || user.email;
            const userStatus = getUserStatus(user);

            return (
              <Card key={user.id} className="bg-slate-800/50 border-slate-700" role="listitem">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <label className="flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-slate-600"
                          aria-label={`Select ${displayName}`}
                        />
                      </label>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700">
                        <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">{displayName}</span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {renderUserMenu(user, true)}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'destructive'
                          : user.role === 'organization_admin'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {user.role === 'organization_admin' ? 'Org Admin' : user.role}
                    </Badge>
                    {userStatus === 'active' ? (
                      <Badge className="bg-green-500/10 text-green-400">
                        <CheckCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                        Active
                      </Badge>
                    ) : userStatus === 'suspended' ? (
                      <Badge className="bg-red-500/10 text-red-400">
                        <Ban className="mr-1 h-3 w-3" aria-hidden="true" />
                        Suspended
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-400">
                        Pending
                      </Badge>
                    )}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-500">Joined</dt>
                      <dd className="text-slate-300">{formatRelativeTime(user.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Role</dt>
                      <dd className="text-slate-300">{user.role}</dd>
                    </div>
                  </dl>

                  {user.wallet_address && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-600">
                      <Wallet className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">Wallet address: </span>
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalUsers > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {users.length} of {totalUsers} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600"
              disabled={page * 20 >= totalUsers}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
