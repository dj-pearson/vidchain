import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">VidChain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Video authenticity verification for the news industry. Powered by blockchain and C2PA standards.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <a
                  href="https://docs.vidchain.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  API Documentation
                </a>
              </li>
              <li>
                <Link to="/integrations" className="hover:text-foreground">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-foreground">
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {currentYear} VidChain. All rights reserved.</p>
          <div className="flex gap-4">
            <a
              href="https://twitter.com/vidchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Twitter
            </a>
            <a
              href="https://github.com/vidchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/company/vidchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
