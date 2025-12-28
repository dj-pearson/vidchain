import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ROUTES } from '@/config/constants';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  X,
  Zap,
  HelpCircle,
  Building2,
  Users,
  Video,
  Globe,
  Code,
  Headphones,
  Lock,
} from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small news teams and independent journalists',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: {
      videos: '50/month',
      apiCalls: '100/month',
      storage: '10 GB',
      teamMembers: '3',
      support: 'Email',
      analytics: 'Basic',
      customBranding: false,
      webhooks: false,
      sso: false,
      sla: false,
      dedicatedSupport: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing newsrooms and media companies',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    popular: true,
    features: {
      videos: '500/month',
      apiCalls: '1,000/month',
      storage: '100 GB',
      teamMembers: '10',
      support: 'Priority',
      analytics: 'Advanced',
      customBranding: true,
      webhooks: true,
      sso: false,
      sla: false,
      dedicatedSupport: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large media organizations with custom needs',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    features: {
      videos: 'Unlimited',
      apiCalls: 'Unlimited',
      storage: '1 TB',
      teamMembers: 'Unlimited',
      support: 'Dedicated',
      analytics: 'Custom',
      customBranding: true,
      webhooks: true,
      sso: true,
      sla: true,
      dedicatedSupport: true,
    },
  },
];

const featureDetails = [
  {
    category: 'Verification',
    features: [
      { name: 'Video verifications', key: 'videos' },
      { name: 'API verification calls', key: 'apiCalls' },
      { name: 'Blockchain registration', all: true },
      { name: 'C2PA metadata embedding', all: true },
      { name: 'IPFS backup storage', all: true },
    ],
  },
  {
    category: 'Storage & Team',
    features: [
      { name: 'Video storage', key: 'storage' },
      { name: 'Team members', key: 'teamMembers' },
      { name: 'Organization dashboard', all: true },
    ],
  },
  {
    category: 'Features',
    features: [
      { name: 'Embeddable badges', all: true },
      { name: 'Custom branding', key: 'customBranding' },
      { name: 'Webhook integrations', key: 'webhooks' },
      { name: 'Analytics', key: 'analytics' },
    ],
  },
  {
    category: 'Support & Security',
    features: [
      { name: 'Support level', key: 'support' },
      { name: 'SSO/SAML', key: 'sso' },
      { name: 'SLA guarantee', key: 'sla' },
      { name: 'Dedicated account manager', key: 'dedicatedSupport' },
    ],
  },
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300">
              Pricing
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Choose the plan that fits your organization. All plans include
              blockchain verification, C2PA compliance, and embeddable badges.
            </p>

            {/* Billing Toggle */}
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-full px-6 py-2 text-sm font-medium transition-colors',
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors',
                  billingCycle === 'yearly'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Yearly
                <Badge className="bg-green-500 text-white">Save 17%</Badge>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'relative',
                  plan.popular && 'border-2 border-purple-600 shadow-lg'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-purple-600 px-4 py-1">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-5xl font-bold">
                      $
                      {billingCycle === 'monthly'
                        ? plan.monthlyPrice
                        : Math.round(plan.yearlyPrice / 12)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    {billingCycle === 'yearly' && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Billed ${plan.yearlyPrice}/year
                      </p>
                    )}
                  </div>

                  <Link to={ROUTES.signup}>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </Link>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">
                        <strong>{plan.features.videos}</strong> video verifications
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">
                        <strong>{plan.features.apiCalls}</strong> API calls
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">
                        <strong>{plan.features.storage}</strong> storage
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">
                        <strong>{plan.features.teamMembers}</strong> team members
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Headphones className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">
                        <strong>{plan.features.support}</strong> support
                      </span>
                    </div>
                    {plan.features.customBranding && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Custom branding</span>
                      </div>
                    )}
                    {plan.features.sso && (
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-green-500" />
                        <span className="text-sm">SSO/SAML</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Compare all features</h2>
            <p className="mt-4 text-muted-foreground">
              Detailed breakdown of what's included in each plan
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-4 text-left font-medium">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-6 py-4 text-center font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureDetails.map((category, ci) => (
                  <>
                    <tr key={category.category} className="bg-slate-100 dark:bg-slate-800">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-sm font-semibold text-muted-foreground"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, fi) => (
                      <tr
                        key={`${ci}-${fi}`}
                        className="border-b border-slate-200 dark:border-slate-700"
                      >
                        <td className="py-4 text-sm">{feature.name}</td>
                        {plans.map((plan) => (
                          <td key={plan.id} className="px-6 py-4 text-center">
                            {feature.all ? (
                              <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                            ) : feature.key ? (
                              typeof plan.features[feature.key as keyof typeof plan.features] ===
                              'boolean' ? (
                                plan.features[feature.key as keyof typeof plan.features] ? (
                                  <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                                ) : (
                                  <X className="mx-auto h-5 w-5 text-gray-300" />
                                )
                              ) : (
                                <span className="text-sm font-medium">
                                  {plan.features[feature.key as keyof typeof plan.features]}
                                </span>
                              )
                            ) : (
                              <X className="mx-auto h-5 w-5 text-gray-300" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                q: 'What happens if I exceed my limits?',
                a: "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity.",
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, all plans come with a 14-day free trial. No credit card required to start.',
              },
              {
                q: 'Do you offer discounts for non-profits?',
                a: 'Yes, we offer 50% discounts for verified non-profit news organizations. Contact us for details.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, wire transfers for annual plans, and can invoice enterprise customers.',
              },
              {
                q: 'Can I cancel anytime?',
                a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
              },
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 shrink-0 text-purple-600" />
                    <div>
                      <h4 className="font-semibold">{faq.q}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <Building2 className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Need a custom plan?</h2>
              </div>
              <p className="mt-2 text-purple-100">
                We offer custom solutions for large media organizations with specific
                requirements.
              </p>
            </div>
            <Link to="/contact">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
