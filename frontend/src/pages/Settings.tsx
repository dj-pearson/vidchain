import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertWithIcon } from '@/components/ui/Alert';
import { User, Mail, Wallet, Building, Save } from 'lucide-react';

export function Settings() {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    wallet_address: profile?.wallet_address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError(null);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {success && (
        <AlertWithIcon variant="success" title="Success">
          Your profile has been updated.
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
                Email cannot be changed
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

            <div>
              <label htmlFor="wallet_address" className="text-sm font-medium">
                Wallet Address
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
                Your Polygon wallet address for receiving NFTs
              </p>
            </div>

            <Button type="submit" isLoading={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription>Manage your organization settings</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.organization_id ? (
            <p className="text-muted-foreground">
              Organization settings coming soon.
            </p>
          ) : (
            <div className="text-center py-6">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 font-medium">No organization</p>
              <p className="text-sm text-muted-foreground">
                You are not part of any organization.
              </p>
              <Button variant="outline" className="mt-4">
                Create Organization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
