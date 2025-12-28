import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Check,
  AlertCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface NewApiKey {
  name: string;
  scopes: string[];
  rate_limit: number;
  expires_in_days: number | null;
}

export function ApiKeys() {
  const { user, currentOrganization } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newKey, setNewKey] = useState<NewApiKey>({
    name: '',
    scopes: ['read', 'verify'],
    rate_limit: 1000,
    expires_in_days: null,
  });

  const availableScopes = [
    { id: 'read', label: 'Read', description: 'View videos and verifications' },
    { id: 'verify', label: 'Verify', description: 'Verify video authenticity' },
    { id: 'upload', label: 'Upload', description: 'Upload new videos' },
    { id: 'mint', label: 'Mint', description: 'Mint verification NFTs' },
    { id: 'admin', label: 'Admin', description: 'Full administrative access' },
  ];

  useEffect(() => {
    if (currentOrganization) {
      fetchApiKeys();
    }
  }, [currentOrganization]);

  const fetchApiKeys = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setApiKeys(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!currentOrganization || !newKey.name) return;

    try {
      setCreating(true);
      setError(null);

      // Generate a random API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKeyValue = `vk_${Array.from(keyBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      // Hash the key for storage
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(apiKeyValue)
      );
      const keyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const expiresAt = newKey.expires_in_days
        ? new Date(Date.now() + newKey.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: createError } = await supabase.from('api_keys').insert({
        organization_id: currentOrganization.id,
        name: newKey.name,
        key_hash: keyHash,
        key_prefix: apiKeyValue.substring(0, 10),
        scopes: newKey.scopes,
        rate_limit: newKey.rate_limit,
        expires_at: expiresAt,
        is_active: true,
      });

      if (createError) throw createError;

      // Show the key to the user (only once!)
      setNewKeyValue(apiKeyValue);

      // Refresh the list
      await fetchApiKeys();

      // Reset form
      setNewKey({
        name: '',
        scopes: ['read', 'verify'],
        rate_limit: 1000,
        expires_in_days: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const toggleKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="mt-1 text-muted-foreground">
            Manage API keys for programmatic access to VidChain
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* New Key Display */}
      {newKeyValue && (
        <Alert variant="warning" className="mb-6">
          <Key className="h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">Save your API key now!</p>
            <p className="mt-1 text-sm">
              This is the only time you'll see this key. Copy it and store it securely.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm">
                {newKeyValue}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKeyValue, 'new-key')}
              >
                {copied === 'new-key' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNewKeyValue(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="e.g., Production API Key"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Scopes</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        newKey.scopes.includes(scope.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={newKey.scopes.includes(scope.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKey({ ...newKey, scopes: [...newKey.scopes, scope.id] });
                          } else {
                            setNewKey({
                              ...newKey,
                              scopes: newKey.scopes.filter((s) => s !== scope.id),
                            });
                          }
                        }}
                        className="mt-1 rounded"
                      />
                      <div>
                        <p className="font-medium">{scope.label}</p>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Rate Limit (requests/hour)</label>
                  <Input
                    type="number"
                    value={newKey.rate_limit}
                    onChange={(e) =>
                      setNewKey({ ...newKey, rate_limit: parseInt(e.target.value) || 1000 })
                    }
                    min={100}
                    max={100000}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expires In (days)</label>
                  <Input
                    type="number"
                    value={newKey.expires_in_days || ''}
                    onChange={(e) =>
                      setNewKey({
                        ...newKey,
                        expires_in_days: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Never expires"
                    min={1}
                    max={365}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createApiKey}
                  disabled={!newKey.name || newKey.scopes.length === 0 || creating}
                >
                  {creating ? <Spinner size="sm" className="mr-2" /> : null}
                  Create Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Key className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No API Keys</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Create your first API key to start integrating with VidChain.
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{key.name}</h3>
                      <Badge variant={key.is_active ? 'success' : 'secondary'}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="rounded bg-muted px-2 py-0.5">
                        {key.key_prefix}...
                      </code>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </span>
                      {key.last_used_at && (
                        <span>
                          Last used {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    {key.expires_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyStatus(key.id, key.is_active)}
                    >
                      {key.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* API Documentation Link */}
      <Card className="mt-8">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <h3 className="font-semibold">API Documentation</h3>
            <p className="text-sm text-muted-foreground">
              Learn how to integrate with the VidChain API
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            View Docs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
