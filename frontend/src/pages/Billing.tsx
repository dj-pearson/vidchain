import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Video,
  HardDrive,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  priceId: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  limits: {
    videos: number | 'Unlimited';
    verifications: number | 'Unlimited';
    storage: string;
    teamMembers: number | 'Unlimited';
    apiRateLimit: number;
  };
  popular?: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  periodEnd?: string;
  usage: {
    videos: { used: number; limit: number };
    verifications: { used: number; limit: number };
    storage: { used: number; limit: number };
  };
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small news teams getting started',
    price: { monthly: 199, yearly: 1990 },
    priceId: { monthly: 'price_starter_monthly', yearly: 'price_starter_yearly' },
    features: [
      '50 video verifications/month',
      '100 API verifications/month',
      '10 GB storage',
      'Up to 3 team members',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      videos: 50,
      verifications: 100,
      storage: '10 GB',
      teamMembers: 3,
      apiRateLimit: 1000,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing newsrooms',
    price: { monthly: 499, yearly: 4990 },
    priceId: { monthly: 'price_professional_monthly', yearly: 'price_professional_yearly' },
    features: [
      '500 video verifications/month',
      '1,000 API verifications/month',
      '100 GB storage',
      'Up to 10 team members',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'Webhook integrations',
    ],
    limits: {
      videos: 500,
      verifications: 1000,
      storage: '100 GB',
      teamMembers: 10,
      apiRateLimit: 10000,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large media organizations',
    price: { monthly: 999, yearly: 9990 },
    priceId: { monthly: 'price_enterprise_monthly', yearly: 'price_enterprise_yearly' },
    features: [
      'Unlimited video verifications',
      'Unlimited API verifications',
      '1 TB storage',
      'Unlimited team members',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option',
      'SSO/SAML',
    ],
    limits: {
      videos: 'Unlimited',
      verifications: 'Unlimited',
      storage: '1 TB',
      teamMembers: 'Unlimited',
      apiRateLimit: 100000,
    },
  },
];

export function Billing() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSubscription();
    }
  }, [profile?.organization_id]);

  const fetchSubscription = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Get organization with subscription info
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
          subscription_status,
          subscription_plan,
          subscription_period_end,
          videos_per_month,
          verifications_per_month,
          storage_gb
        `)
        .eq('id', profile.organization_id)
        .single();

      if (orgError) throw orgError;

      // Get current usage
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startOfMonth.toISOString());

      const { count: verificationCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startOfMonth.toISOString());

      // Type assertion for org data
      const orgData = org as {
        subscription_plan?: string;
        subscription_status?: string;
        subscription_period_end?: string;
        videos_per_month?: number;
        verifications_per_month?: number;
        storage_gb?: number;
      };

      setSubscription({
        plan: orgData.subscription_plan || 'free',
        status: orgData.subscription_status || 'inactive',
        periodEnd: orgData.subscription_period_end,
        usage: {
          videos: {
            used: videoCount || 0,
            limit: orgData.videos_per_month || 5,
          },
          verifications: {
            used: verificationCount || 0,
            limit: orgData.verifications_per_month || 10,
          },
          storage: {
            used: 0, // Would need to calculate from storage
            limit: orgData.storage_gb || 1,
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      setCheckoutLoading(plan.id);
      setError(null);

      const priceId = billingCycle === 'monthly' ? plan.priceId.monthly : plan.priceId.yearly;

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/settings/billing?success=true`,
          cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(100, (used / limit) * 100);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Current Plan Overview */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold capitalize">{subscription.plan}</h3>
                  <Badge
                    variant={
                      subscription.status === 'active'
                        ? 'success'
                        : subscription.status === 'past_due'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                {subscription.periodEnd && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-4 w-4" />
                    Renews on {new Date(subscription.periodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Payment Method
              </Button>
            </div>

            {/* Usage */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Videos
                  </span>
                  <span>
                    {subscription.usage.videos.used} /{' '}
                    {subscription.usage.videos.limit === -1
                      ? '∞'
                      : subscription.usage.videos.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    subscription.usage.videos.used,
                    subscription.usage.videos.limit
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Verifications
                  </span>
                  <span>
                    {subscription.usage.verifications.used} /{' '}
                    {subscription.usage.verifications.limit === -1
                      ? '∞'
                      : subscription.usage.verifications.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    subscription.usage.verifications.used,
                    subscription.usage.verifications.limit
                  )}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Storage
                  </span>
                  <span>
                    {subscription.usage.storage.used} GB / {subscription.usage.storage.limit} GB
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    subscription.usage.storage.used,
                    subscription.usage.storage.limit
                  )}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            billingCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            billingCycle === 'yearly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Yearly
          <Badge variant="success" className="ml-2">Save 17%</Badge>
        </button>
      </div>

      {/* Pricing Plans */}
      <div className="grid gap-8 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative',
              plan.popular && 'border-primary ring-2 ring-primary'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1">
                  <Zap className="h-3 w-3" />
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                </span>
                <span className="text-muted-foreground">/month</span>
                {billingCycle === 'yearly' && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Billed ${plan.price.yearly}/year
                  </p>
                )}
              </div>

              <Button
                className="w-full gap-2"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan)}
                disabled={
                  checkoutLoading !== null ||
                  subscription?.plan === plan.id
                }
              >
                {checkoutLoading === plan.id ? (
                  <Spinner size="sm" />
                ) : subscription?.plan === plan.id ? (
                  'Current Plan'
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ or Contact */}
      <Card className="mt-8">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold">Need a custom plan?</h3>
            <p className="text-sm text-muted-foreground">
              Contact us for custom pricing for large organizations
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            Contact Sales
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
