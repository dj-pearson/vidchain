import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

/**
 * ExternalLinkWithIcon - Accessible external link with visual and screen reader indicators
 */
function ExternalLinkA({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t bg-background"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold">VidChain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Video authenticity verification for the news industry. Powered by blockchain and C2PA standards.
            </p>
          </div>

          {/* Product Navigation */}
          <nav aria-labelledby="footer-product-heading">
            <h2 id="footer-product-heading" className="mb-4 font-semibold">Product</h2>
            <ul className="space-y-2 text-sm text-muted-foreground" role="list">
              <li>
                <Link
                  to="/features"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <ExternalLinkA
                  href="https://docs.vidchain.io"
                  className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  API Documentation
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </ExternalLinkA>
              </li>
              <li>
                <Link
                  to="/integrations"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company Navigation */}
          <nav aria-labelledby="footer-company-heading">
            <h2 id="footer-company-heading" className="mb-4 font-semibold">Company</h2>
            <ul className="space-y-2 text-sm text-muted-foreground" role="list">
              <li>
                <Link
                  to="/about"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal Navigation */}
          <nav aria-labelledby="footer-legal-heading">
            <h2 id="footer-legal-heading" className="mb-4 font-semibold">Legal</h2>
            <ul className="space-y-2 text-sm text-muted-foreground" role="list">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/dmca"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  DMCA
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {currentYear} VidChain. All rights reserved.</p>
          <nav aria-label="Social media links">
            <ul className="flex gap-4" role="list">
              <li>
                <ExternalLinkA
                  href="https://twitter.com/vidchain"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Twitter
                </ExternalLinkA>
              </li>
              <li>
                <ExternalLinkA
                  href="https://github.com/vidchain"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  GitHub
                </ExternalLinkA>
              </li>
              <li>
                <ExternalLinkA
                  href="https://linkedin.com/company/vidchain"
                  className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  LinkedIn
                </ExternalLinkA>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
