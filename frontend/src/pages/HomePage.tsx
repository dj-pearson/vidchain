import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/config/constants';
import {
  Shield,
  CheckCircle,
  Video,
  Lock,
  Globe,
  Zap,
  FileCheck,
  Link as LinkIcon,
  Play,
  ArrowRight,
  Star,
  Building2,
  Newspaper,
  Camera,
  Scale,
  ChevronRight,
} from 'lucide-react';

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
              <Shield className="mr-1 h-3 w-3" />
              Blockchain-Verified Video Authenticity
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Prove Your Video is{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Authentic
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-300 sm:text-xl">
              VidChain creates an immutable blockchain record of your video content.
              Protect against deepfakes, prove ownership, and build trust with your audience
              using C2PA-compliant verification that stays with your video forever.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={ROUTES.signup}>
                <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  Start Verifying Videos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={ROUTES.verify}>
                <Button size="lg" variant="outline" className="gap-2 border-gray-600 text-white hover:bg-white/10">
                  <Play className="h-4 w-4" />
                  Verify a Video
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                C2PA Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Polygon Blockchain
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                IPFS Storage
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Embeddable Badges
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-b bg-slate-50 py-12 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
            TRUSTED BY LEADING NEWS ORGANIZATIONS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Newspaper className="h-6 w-6" /> NewsDaily
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <Globe className="h-6 w-6" /> GlobalMedia
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <Camera className="h-6 w-6" /> PhotoWire
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-6 w-6" /> MediaCorp
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <Badge variant="destructive" className="mb-4">The Problem</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Deepfakes and manipulated videos are eroding trust
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                In an era of AI-generated content, how can viewers trust that what they're
                watching is authentic? News organizations, content creators, and businesses
                need a way to prove their videos haven't been tampered with.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Deepfakes are becoming indistinguishable from real footage',
                  'Social media strips metadata from uploaded videos',
                  'No standard way to verify video authenticity',
                  'Misinformation spreads faster than fact-checks',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                      ×
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Badge variant="success" className="mb-4">The Solution</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Blockchain verification that travels with your video
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                VidChain creates a cryptographic fingerprint of your video and stores it
                permanently on the Polygon blockchain. This verification can be checked
                by anyone, anywhere, at any time.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Immutable proof stored on Polygon blockchain',
                  'C2PA-compliant metadata embedded in videos',
                  'Verification badges for your website and social media',
                  'API for automated verification at scale',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to verified authenticity
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our process creates a permanent, tamper-proof record of your video content
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Video,
                title: 'Upload Your Video',
                description:
                  'Upload your video to VidChain. We compute a unique SHA-256 cryptographic hash that serves as a digital fingerprint.',
              },
              {
                step: '02',
                icon: Lock,
                title: 'Blockchain Registration',
                description:
                  'The hash is permanently recorded on the Polygon blockchain as an NFT, along with IPFS storage for redundancy.',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Verify Anywhere',
                description:
                  'Anyone can verify your video by comparing its hash to the blockchain record. Embed badges on your site for instant trust.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative rounded-2xl border bg-background p-8 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-5xl font-bold text-purple-600/20">
                    {item.step}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <item.icon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border bg-gradient-to-r from-purple-50 to-pink-50 p-8 dark:from-purple-950/50 dark:to-pink-950/50">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  C2PA Metadata: The Industry Standard
                </h3>
                <p className="mt-2 text-muted-foreground">
                  VidChain uses the Coalition for Content Provenance and Authenticity (C2PA)
                  standard to embed verification data directly into your video files. This
                  metadata travels with your video across platforms.
                </p>
              </div>
              <Link to="/how-it-works">
                <Button variant="outline" className="shrink-0 gap-2">
                  Learn More
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for video verification
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Blockchain Verification',
                description:
                  'Every video gets a unique NFT on Polygon with immutable proof of authenticity.',
              },
              {
                icon: FileCheck,
                title: 'C2PA Compliance',
                description:
                  'Industry-standard metadata that major platforms and browsers will recognize.',
              },
              {
                icon: Globe,
                title: 'IPFS Storage',
                description:
                  'Decentralized backup storage ensures your verification data is always accessible.',
              },
              {
                icon: LinkIcon,
                title: 'Embeddable Badges',
                description:
                  'Add verification badges to your website that link to blockchain proof.',
              },
              {
                icon: Zap,
                title: 'API Access',
                description:
                  'Automate verification for high-volume workflows with our REST API.',
              },
              {
                icon: Scale,
                title: 'Legal Evidence',
                description:
                  'Blockchain records provide timestamped proof for legal proceedings.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Plans for every organization
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From individual journalists to enterprise media organizations
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: 199,
                description: 'For small news teams getting started',
                features: [
                  '50 video verifications/month',
                  '100 API verifications/month',
                  '10 GB storage',
                  'Up to 3 team members',
                  'Email support',
                ],
              },
              {
                name: 'Professional',
                price: 499,
                description: 'For growing newsrooms',
                popular: true,
                features: [
                  '500 video verifications/month',
                  '1,000 API verifications/month',
                  '100 GB storage',
                  'Up to 10 team members',
                  'Priority support',
                  'Custom branding',
                  'Webhook integrations',
                ],
              },
              {
                name: 'Enterprise',
                price: 999,
                description: 'For large media organizations',
                features: [
                  'Unlimited video verifications',
                  'Unlimited API verifications',
                  '1 TB storage',
                  'Unlimited team members',
                  'Dedicated support',
                  'SLA guarantee',
                  'Custom integrations',
                  'SSO/SAML',
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border bg-background p-8 ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Link to={ROUTES.signup}>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-muted-foreground">
            Need a custom plan?{' '}
            <a href="/contact" className="text-purple-600 hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by media professionals
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  'VidChain has become essential to our verification workflow. Our audience trusts our content because they can verify it themselves.',
                author: 'Sarah Chen',
                role: 'Head of Digital, NewsDaily',
                rating: 5,
              },
              {
                quote:
                  'The blockchain verification gives our investigative journalism an extra layer of credibility that viewers appreciate.',
                author: 'Marcus Johnson',
                role: 'Investigative Reporter',
                rating: 5,
              },
              {
                quote:
                  'We integrated the API into our CMS. Now every video we publish is automatically verified and badged.',
                author: 'Elena Rodriguez',
                role: 'CTO, MediaCorp',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-xl border bg-slate-50 p-6 dark:bg-slate-900"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-muted-foreground">"{testimonial.quote}"</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to verify your videos?
          </h2>
          <p className="mt-4 text-lg text-purple-100">
            Join leading news organizations protecting their content with blockchain verification.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to={ROUTES.signup}>
              <Button
                size="lg"
                className="gap-2 bg-white text-purple-600 hover:bg-purple-50"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white text-white hover:bg-white/10"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 py-12 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Shield className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold">VidChain</span>
              </div>
              <p className="mt-4 text-sm">
                Blockchain-verified video authenticity for the news industry.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Product</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="/how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
                <li><a href="/verify" className="hover:text-white">Verify Video</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Company</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} VidChain. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
