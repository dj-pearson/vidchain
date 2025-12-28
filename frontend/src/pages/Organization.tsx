import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertWithIcon } from '@/components/ui/Alert';
import {
  Building,
  Users,
  Mail,
  Shield,
  Plus,
  Trash2,
  Crown,
  UserMinus,
  Settings,
  Globe,
  Upload,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

// Mock team members for demo
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'owner',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'member',
    joinedAt: '2024-03-10',
  },
];

export function Organization() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const [orgSettings, setOrgSettings] = useState({
    name: 'Acme Media Corp',
    domain: 'acme.com',
    allowPublicVerify: true,
    requireApproval: false,
    defaultWatermark: true,
  });

  const hasOrganization = !!profile?.organization_id || true; // For demo purposes

  const handleOrgSettingChange = (key: keyof typeof orgSettings, value: boolean | string) => {
    setOrgSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch {
      setError('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    setSuccess('Team member removed');
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!hasOrganization) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center py-16">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Building className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Create Your Organization</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Organizations let you collaborate with your team, manage permissions, and share
            verification assets.
          </p>

          <Card className="mt-8 text-left">
            <CardContent className="pt-6">
              <form className="space-y-4">
                <div>
                  <label htmlFor="org-name" className="text-sm font-medium">
                    Organization Name
                  </label>
                  <Input
                    id="org-name"
                    placeholder="Enter your organization name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="org-domain" className="text-sm font-medium">
                    Company Domain (optional)
                  </label>
                  <Input
                    id="org-domain"
                    placeholder="example.com"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Users with this email domain can auto-join your organization
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  <Building className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team members, and permissions
        </p>
      </div>

      {success && (
        <AlertWithIcon variant="success" title="Success">
          {success}
        </AlertWithIcon>
      )}

      {error && (
        <AlertWithIcon variant="destructive" title="Error">
          {error}
        </AlertWithIcon>
      )}

      {/* Organization Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Profile
          </CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="org-name" className="text-sm font-medium">
                  Organization Name
                </label>
                <Input
                  id="org-name"
                  value={orgSettings.name}
                  onChange={(e) => handleOrgSettingChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="org-domain" className="text-sm font-medium">
                  Company Domain
                </label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="org-domain"
                    value={orgSettings.domain}
                    onChange={(e) => handleOrgSettingChange('domain', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Manage who has access to your organization</CardDescription>
            </div>
            <Button onClick={() => setShowInviteForm(!showInviteForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invite Form */}
          {showInviteForm && (
            <form onSubmit={handleInvite} className="mb-6 rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-3 font-medium">Invite New Member</h4>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button type="submit" isLoading={isLoading}>
                  Send Invite
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                They will receive an email invitation to join your organization
              </p>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role === 'owner' && <Crown className="mr-1 inline h-3 w-3" />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role !== 'owner' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions & Policies
          </CardTitle>
          <CardDescription>Configure organization-wide settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow public verification</p>
              <p className="text-sm text-muted-foreground">
                Anyone can verify videos from your organization
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleOrgSettingChange('allowPublicVerify', !orgSettings.allowPublicVerify)
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                orgSettings.allowPublicVerify ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  orgSettings.allowPublicVerify ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require approval for uploads</p>
              <p className="text-sm text-muted-foreground">
                Admins must approve videos before they can be verified
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOrgSettingChange('requireApproval', !orgSettings.requireApproval)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                orgSettings.requireApproval ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  orgSettings.requireApproval ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Default watermark</p>
              <p className="text-sm text-muted-foreground">
                Automatically add organization watermark to verified videos
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleOrgSettingChange('defaultWatermark', !orgSettings.defaultWatermark)
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                orgSettings.defaultWatermark ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  orgSettings.defaultWatermark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible organization actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium">Transfer Ownership</p>
              <p className="text-sm text-muted-foreground">
                Transfer organization ownership to another admin
              </p>
            </div>
            <Button variant="outline">Transfer</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-destructive">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data
              </p>
            </div>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
