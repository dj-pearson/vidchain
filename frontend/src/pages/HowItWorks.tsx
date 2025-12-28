import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/config/constants';
import {
  Shield,
  Video,
  Lock,
  Globe,
  FileCheck,
  CheckCircle,
  ArrowRight,
  ArrowDown,
  Fingerprint,
  Database,
  Link as LinkIcon,
  Eye,
  Code,
  Layers,
} from 'lucide-react';

export function HowItWorks() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300">
              How VidChain Works
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              From Upload to Verified: The Complete Journey
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Understanding how blockchain verification protects your video content
              and creates lasting proof of authenticity.
            </p>
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Step 1 */}
            <div className="relative flex gap-8">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                  <Video className="h-8 w-8" />
                </div>
                <div className="mt-4 h-full w-px bg-gradient-to-b from-purple-500 to-transparent" />
              </div>
              <div className="pb-16">
                <Badge>Step 1</Badge>
                <h2 className="mt-4 text-2xl font-bold">Upload Your Video</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  When you upload a video to VidChain, our system processes it through
                  multiple verification stages to create an unbreakable chain of authenticity.
                </p>
                <Card className="mt-6">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="flex gap-4">
                      <Fingerprint className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">SHA-256 Hash Generation</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We compute a unique cryptographic fingerprint of your video.
                          Any modification, even a single pixel, produces a completely
                          different hash.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Layers className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">Metadata Extraction</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We capture technical details like resolution, duration, codec,
                          and creation timestamps to include in the verification record.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-8">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                  <Lock className="h-8 w-8" />
                </div>
                <div className="mt-4 h-full w-px bg-gradient-to-b from-purple-500 to-transparent" />
              </div>
              <div className="pb-16">
                <Badge>Step 2</Badge>
                <h2 className="mt-4 text-2xl font-bold">Blockchain Registration</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The hash and metadata are permanently recorded on the Polygon blockchain
                  as an NFT. This creates an immutable, timestamped proof that cannot be
                  altered or deleted.
                </p>
                <Card className="mt-6">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="flex gap-4">
                      <Database className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">Polygon Blockchain</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We use Polygon for fast, low-cost transactions while maintaining
                          Ethereum-level security and decentralization.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Globe className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">IPFS Storage</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          A copy of your video is stored on IPFS for decentralized backup,
                          ensuring the original is always accessible.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-6 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-sm font-medium text-muted-foreground">
                    Example Blockchain Record:
                  </p>
                  <pre className="mt-2 overflow-x-auto text-xs">
{`{
  "tokenId": 1234,
  "sha256Hash": "0x8f14e45f...",
  "ipfsCid": "QmX7bVbkR...",
  "timestamp": 1703894400,
  "owner": "0x742d35Cc..."
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-8">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                  <FileCheck className="h-8 w-8" />
                </div>
                <div className="mt-4 h-full w-px bg-gradient-to-b from-purple-500 to-transparent" />
              </div>
              <div className="pb-16">
                <Badge>Step 3</Badge>
                <h2 className="mt-4 text-2xl font-bold">C2PA Metadata Embedding</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Following the C2PA (Coalition for Content Provenance and Authenticity)
                  standard, verification data is embedded directly into your video file.
                  This metadata travels with your video across platforms.
                </p>
                <Card className="mt-6 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Shield className="h-8 w-8 text-purple-600" />
                      <div>
                        <h4 className="text-lg font-semibold">What is C2PA?</h4>
                        <p className="mt-2 text-muted-foreground">
                          C2PA is an industry standard developed by Adobe, Microsoft, Intel,
                          and major news organizations to combat misinformation. It defines
                          how provenance information should be attached to digital content.
                        </p>
                        <ul className="mt-4 space-y-2">
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Supported by major browsers and platforms
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Tamper-evident cryptographic signatures
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Survives format conversions and re-encoding
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex gap-8">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                  <Eye className="h-8 w-8" />
                </div>
              </div>
              <div>
                <Badge>Step 4</Badge>
                <h2 className="mt-4 text-2xl font-bold">Verification & Display</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Anyone can verify your video by uploading it to VidChain or using our API.
                  Display verification badges on your website to build instant trust with viewers.
                </p>
                <Card className="mt-6">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="flex gap-4">
                      <LinkIcon className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">Embeddable Badges</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add verification badges to your website that link directly
                          to the blockchain proof.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Code className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <h4 className="font-semibold">API Integration</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Integrate verification into your CMS or publishing workflow
                          with our REST API.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Badge Example */}
                <div className="mt-6 rounded-lg border p-6">
                  <h4 className="font-semibold">Example Verification Badge:</h4>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800 dark:bg-green-950/30">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          Verified by VidChain
                        </p>
                        <p className="text-xs text-green-600/70">
                          Token #1234 on Polygon
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clicks through to blockchain proof
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Flow Diagram */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">The Verification Process</h2>
            <p className="mt-4 text-muted-foreground">
              How viewers verify that a video is authentic
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { icon: Video, label: 'Viewer sees video' },
                { icon: ArrowRight, label: '' },
                { icon: Fingerprint, label: 'Computes hash' },
                { icon: ArrowRight, label: '' },
                { icon: Database, label: 'Checks blockchain' },
              ].map((item, i) =>
                item.label ? (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <item.icon className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="mt-3 text-center text-sm font-medium">{item.label}</p>
                  </div>
                ) : (
                  <div key={i} className="flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <ArrowDown className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400">
                        Hash Matches
                      </h4>
                      <p className="text-sm text-green-600/70">
                        Video is verified authentic and unmodified
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-400">
                        Hash Doesn't Match
                      </h4>
                      <p className="text-sm text-red-600/70">
                        Video has been modified or is not the original
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Technical Specifications</h2>
            <p className="mt-4 text-muted-foreground">
              Built on proven, industry-standard technologies
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold">Hash Algorithm</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  SHA-256 (Secure Hash Algorithm 256-bit)
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• 256-bit output (64 hex characters)</li>
                  <li>• Collision-resistant</li>
                  <li>• Industry standard for file integrity</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold">Blockchain</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Polygon PoS (Proof of Stake)
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• EVM compatible</li>
                  <li>• Low transaction costs</li>
                  <li>• High throughput (65,000 TPS)</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold">Smart Contract</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  ERC-721 NFT with EIP-2981 Royalties
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Open source and audited</li>
                  <li>• Non-transferable option available</li>
                  <li>• Batch minting supported</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold">Storage</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  IPFS via Pinata
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>• Content-addressed storage</li>
                  <li>• Decentralized redundancy</li>
                  <li>• Permanent availability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to protect your video content?
          </h2>
          <p className="mt-4 text-purple-100">
            Start verifying your videos with blockchain-backed authenticity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.signup}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                Get Started Free
              </Button>
            </Link>
            <Link to={ROUTES.verify}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Try Verification
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
