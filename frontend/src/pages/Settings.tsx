import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertWithIcon } from '@/components/ui/Alert';
import {
  User,
  Mail,
  Wallet,
  Save,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';

export function Settings() {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    wallet_address: profile?.wallet_address || '',
  });

  const [notifications, setNotifications] = useState({
    emailVerifications: true,
    emailWeeklyDigest: false,
    emailApiAlerts: true,
    pushVerifications: false,
    pushMinting: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await updateUserProfile(user.id, {
        full_name: formData.full_name || null,
        wallet_address: formData.wallet_address || null,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Password update would be handled here
    setSuccess(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {success && (
        <AlertWithIcon variant="success" title="Success">
          Your settings have been updated.
        </AlertWithIcon>
      )}

      {error && (
        <AlertWithIcon variant="destructive" title="Error">
          {error}
        </AlertWithIcon>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-9"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Contact support to change email
                </p>
              </div>

              <div>
                <label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="wallet_address" className="text-sm font-medium">
                Default Wallet Address
              </label>
              <div className="relative mt-1">
                <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="wallet_address"
                  name="wallet_address"
                  value={formData.wallet_address}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="pl-9 font-mono"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your Polygon wallet address for receiving NFTs. You can also connect a wallet at upload time.
              </p>
            </div>

            <Button type="submit" isLoading={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" />
              Email Notifications
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Verification alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email when your videos are verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('emailVerifications')}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications.emailVerifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications.emailVerifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly digest</p>
                  <p className="text-sm text-muted-foreground">
                    Summary of your video activity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('emailWeeklyDigest')}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications.emailWeeklyDigest ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications.emailWeeklyDigest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API usage alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Alerts when approaching API limits
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('emailApiAlerts')}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications.emailApiAlerts ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications.emailApiAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="border-t pt-6">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Smartphone className="h-4 w-4" />
              Push Notifications
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Verification complete</p>
                  <p className="text-sm text-muted-foreground">
                    Push notification when verification finishes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('pushVerifications')}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications.pushVerifications ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications.pushVerifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium">NFT minting</p>
                  <p className="text-sm text-muted-foreground">
                    Notification when NFT minting completes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('pushMinting')}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    notifications.pushMinting ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      notifications.pushMinting ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize your visual preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative flex h-10 w-20 items-center rounded-full p-1 transition-colors ${
                isDarkMode ? 'bg-slate-800' : 'bg-amber-100'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-transform ${
                  isDarkMode ? 'translate-x-10' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-slate-800" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h4 className="font-medium">Change Password</h4>
            <div className="grid gap-4">
              <div>
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" variant="secondary">
              Update Password
            </Button>
          </form>

          {/* Two-Factor Authentication */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="border-t pt-6">
            <h4 className="mb-3 font-medium">Active Sessions</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on macOS • Active now
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Active
                </span>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              Sign out all other sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your data including videos, verifications, and settings
              </p>
            </div>
            <Button variant="outline">Export Data</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
