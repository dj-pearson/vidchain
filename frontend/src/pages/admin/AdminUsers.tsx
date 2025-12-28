import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import {
  Search,
  Filter,
  MoreVertical,
  User,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Wallet,
  Video,
  ShoppingBag,
  Eye,
  Edit,
  Trash2,
  Download,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';

// Mock users data
const MOCK_USERS = [
  {
    id: '1',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    walletAddress: '0x1234...5678',
    role: 'user',
    status: 'active',
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    stats: {
      videos: 45,
      nfts: 12,
      sales: 8,
      volume: '2.5',
    },
  },
  {
    id: '2',
    email: 'nasa.archives@nasa.gov',
    fullName: 'NASA Archives',
    walletAddress: '0x2345...6789',
    role: 'organization_admin',
    status: 'active',
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    stats: {
      videos: 234,
      nfts: 156,
      sales: 89,
      volume: '45.6',
    },
  },
  {
    id: '3',
    email: 'suspicious@fake.com',
    fullName: 'Suspicious User',
    walletAddress: '0x3456...7890',
    role: 'user',
    status: 'suspended',
    verified: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastActive: new Date(Date.now() - 86400000 * 2).toISOString(),
    stats: {
      videos: 3,
      nfts: 0,
      sales: 0,
      volume: '0',
    },
    suspendReason: 'Suspected fraudulent activity',
  },
  {
    id: '4',
    email: 'creator@independent.com',
    fullName: 'Independent Creator',
    walletAddress: '0x4567...8901',
    role: 'user',
    status: 'active',
    verified: false,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    lastActive: new Date(Date.now() - 1800000).toISOString(),
    stats: {
      videos: 28,
      nfts: 15,
      sales: 12,
      volume: '8.2',
    },
  },
  {
    id: '5',
    email: 'admin@vidchain.io',
    fullName: 'Platform Admin',
    walletAddress: '0x5678...9012',
    role: 'admin',
    status: 'active',
    verified: true,
    createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
    lastActive: new Date(Date.now() - 300000).toISOString(),
    stats: {
      videos: 0,
      nfts: 0,
      sales: 0,
      volume: '0',
    },
  },
];

type UserRole = 'all' | 'user' | 'organization_admin' | 'admin';
type UserStatus = 'all' | 'active' | 'suspended' | 'pending';

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.walletAddress.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">
            {MOCK_USERS.length} total users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">{MOCK_USERS.length}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {MOCK_USERS.filter((u) => u.status === 'active').length}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {MOCK_USERS.filter((u) => u.status === 'suspended').length}
                </p>
                <p className="text-sm text-slate-400">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {MOCK_USERS.filter((u) => u.verified).length}
                </p>
                <p className="text-sm text-slate-400">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by email, name, or wallet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="organization_admin">Org Admin</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-slate-900 p-3">
              <span className="text-sm text-slate-400">
                {selectedUsers.length} selected
              </span>
              <Button size="sm" variant="outline" className="border-slate-600">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button size="sm" variant="outline" className="border-slate-600">
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </Button>
              <Button size="sm" variant="outline" className="border-red-600 text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">User</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Role</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Stats</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Joined</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{user.fullName}</span>
                          {user.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.walletAddress && (
                          <p className="flex items-center gap-1 text-xs text-slate-600">
                            <Wallet className="h-3 w-3" />
                            {user.walletAddress}
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
                      {user.status === 'active' ? (
                        <Badge className="bg-green-500/10 text-green-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : user.status === 'suspended' ? (
                        <Badge className="bg-red-500/10 text-red-400">
                          <Ban className="mr-1 h-3 w-3" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-400">
                          Pending
                        </Badge>
                      )}
                    </div>
                    {user.suspendReason && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        {user.suspendReason}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Video className="h-3 w-3" />
                        {user.stats.videos} videos
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <ShoppingBag className="h-3 w-3" />
                        {user.stats.sales} sales ({user.stats.volume} ETH)
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="text-slate-300">{formatRelativeTime(user.createdAt)}</p>
                      <p className="text-xs text-slate-500">
                        Last: {formatRelativeTime(user.lastActive)}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="rounded p-2 hover:bg-slate-700"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>

                      {menuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg">
                            <Link
                              to={ROUTES.adminUser(user.id)}
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                              onClick={() => setMenuOpen(null)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                            <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Edit className="h-4 w-4" />
                              Edit User
                            </button>
                            <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Mail className="h-4 w-4" />
                              Send Email
                            </button>
                            {user.status === 'active' ? (
                              <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-yellow-400 hover:bg-slate-700">
                                <Ban className="h-4 w-4" />
                                Suspend User
                              </button>
                            ) : (
                              <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-green-400 hover:bg-slate-700">
                                <CheckCircle className="h-4 w-4" />
                                Reactivate
                              </button>
                            )}
                            <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-400 hover:bg-slate-700">
                              <Trash2 className="h-4 w-4" />
                              Delete User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsers;
