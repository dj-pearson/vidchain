import { Link } from 'react-router-dom';
import {
  Shield,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle,
  Keyboard,
  Eye,
  Volume2,
  MousePointer,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Accessibility() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-purple-400" aria-hidden="true" />
              <span className="text-sm font-medium text-purple-300">
                Accessibility Statement
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Accessibility at VidChain
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              We are committed to ensuring digital accessibility for people with disabilities.
              We are continually improving the user experience for everyone and applying the
              relevant accessibility standards.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-12">

            {/* Our Commitment */}
            <section aria-labelledby="commitment-heading">
              <h2 id="commitment-heading" className="text-2xl font-bold mb-6">
                Our Commitment to Accessibility
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  VidChain is committed to providing a website that is accessible to the widest
                  possible audience, regardless of technology or ability. We are actively working
                  to increase the accessibility and usability of our website and in doing so adhere
                  to many of the available standards and guidelines.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  This website endeavors to conform to level AA of the World Wide Web Consortium
                  (W3C) <a href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                  target="_blank" rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline">
                  Web Content Accessibility Guidelines 2.1
                  <span className="sr-only"> (opens in new tab)</span>
                  </a>. These guidelines explain how to make web content more
                  accessible for people with disabilities and more user-friendly for everyone.
                </p>
              </div>
            </section>

            {/* Conformance Status */}
            <section aria-labelledby="conformance-heading">
              <h2 id="conformance-heading" className="text-2xl font-bold mb-6">
                Conformance Status
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">WCAG 2.1 Level AA</h3>
                      <p className="text-muted-foreground mt-2">
                        VidChain is partially conformant with WCAG 2.1 Level AA. Partially conformant
                        means that some parts of the content do not fully conform to the accessibility
                        standard. We are actively working to achieve full conformance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Accessibility Features */}
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-2xl font-bold mb-6">
                Accessibility Features
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Keyboard className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      Keyboard Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      All functionality is available using a keyboard. Users can navigate through
                      the site using Tab, Shift+Tab, Enter, and arrow keys. Skip links allow users
                      to bypass repetitive navigation.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      Screen Reader Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Our website is optimized for screen readers with proper ARIA labels,
                      semantic HTML structure, and meaningful link text. Live regions announce
                      dynamic content changes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      Visual Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      We provide sufficient color contrast ratios, do not rely solely on color
                      to convey information, and support browser zoom up to 200% without loss
                      of content or functionality.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      Video Accessibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Videos include support for captions and can be controlled via keyboard.
                      Video players provide accessible controls and do not autoplay with sound.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <MousePointer className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      Focus Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      All interactive elements have visible focus indicators to help keyboard
                      users track their location on the page. Focus is managed appropriately
                      in modals and dialogs.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      Motion Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      We respect the "prefers-reduced-motion" setting. Users who prefer
                      reduced motion will experience minimal or no animations throughout
                      the site.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section aria-labelledby="shortcuts-heading">
              <h2 id="shortcuts-heading" className="text-2xl font-bold mb-6">
                Keyboard Shortcuts
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    The following keyboard shortcuts are available throughout the site:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="table">
                      <thead>
                        <tr className="border-b">
                          <th scope="col" className="py-3 text-left font-semibold">Shortcut</th>
                          <th scope="col" className="py-3 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Tab</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Move to next interactive element</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Shift</kbd>
                            {' + '}
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Tab</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Move to previous interactive element</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Enter</kbd>
                            {' or '}
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Space</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Activate focused button or link</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">Esc</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Close modal or dropdown</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">↑</kbd>
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs ml-1">↓</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Navigate within menus and lists</td>
                        </tr>
                        <tr>
                          <td className="py-3">
                            <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">?</kbd>
                          </td>
                          <td className="py-3 text-muted-foreground">Open keyboard shortcuts help (when available)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Assistive Technologies */}
            <section aria-labelledby="assistive-heading">
              <h2 id="assistive-heading" className="text-2xl font-bold mb-6">
                Compatibility with Assistive Technologies
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  VidChain is designed to be compatible with the following assistive technologies:
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground" role="list">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Screen readers (JAWS, NVDA, VoiceOver, TalkBack)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Screen magnification software
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Speech recognition software
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Keyboard-only navigation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Browser accessibility extensions
                  </li>
                </ul>
              </div>
            </section>

            {/* Known Limitations */}
            <section aria-labelledby="limitations-heading">
              <h2 id="limitations-heading" className="text-2xl font-bold mb-6">
                Known Limitations
              </h2>
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Despite our best efforts to ensure accessibility of VidChain, there may be
                    some limitations. Below is a description of known limitations and potential
                    solutions. Please contact us if you observe an issue not listed below.
                  </p>
                  <ul className="space-y-4 text-sm" role="list">
                    <li>
                      <strong className="text-foreground">User-uploaded video content:</strong>
                      <span className="text-muted-foreground">
                        {' '}Videos uploaded by users may not have captions. We encourage all users
                        to provide captions for their video content. We are working on automatic
                        captioning features.
                      </span>
                    </li>
                    <li>
                      <strong className="text-foreground">Third-party content:</strong>
                      <span className="text-muted-foreground">
                        {' '}Some third-party integrations (such as wallet connections) may have
                        accessibility limitations beyond our direct control. We work with these
                        providers to improve accessibility.
                      </span>
                    </li>
                    <li>
                      <strong className="text-foreground">Legacy PDF documents:</strong>
                      <span className="text-muted-foreground">
                        {' '}Some older PDF documents may not be fully accessible. Contact us
                        for alternative formats.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Feedback */}
            <section aria-labelledby="feedback-heading">
              <h2 id="feedback-heading" className="text-2xl font-bold mb-6">
                Feedback & Contact Information
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-6">
                    We welcome your feedback on the accessibility of VidChain. Please let us know
                    if you encounter accessibility barriers or have suggestions for improvement:
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <a
                      href="mailto:accessibility@vidchain.io"
                      className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                    >
                      <Mail className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">accessibility@vidchain.io</p>
                      </div>
                    </a>
                    <a
                      href="tel:+18005551234"
                      className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
                    >
                      <Phone className="h-5 w-5 text-purple-600" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">1-800-555-1234</p>
                      </div>
                    </a>
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">
                    We try to respond to accessibility feedback within 2 business days and to
                    propose a solution within 10 business days.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Enforcement Procedures */}
            <section aria-labelledby="enforcement-heading">
              <h2 id="enforcement-heading" className="text-2xl font-bold mb-6">
                Enforcement Procedure
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  If you are not satisfied with our response to your accessibility concern,
                  you may escalate the issue through the following channels:
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">1.</span>
                    Contact our Accessibility Coordinator directly at{' '}
                    <a href="mailto:accessibility-coordinator@vidchain.io" className="text-purple-600 hover:text-purple-700 underline">
                      accessibility-coordinator@vidchain.io
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">2.</span>
                    File a complaint with the{' '}
                    <a
                      href="https://www.ada.gov/file-a-complaint/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline inline-flex items-center gap-1"
                    >
                      U.S. Department of Justice
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    Contact the{' '}
                    <a
                      href="https://www.access-board.gov/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline inline-flex items-center gap-1"
                    >
                      U.S. Access Board
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                    {' '}for guidance and resources
                  </li>
                </ul>
              </div>
            </section>

            {/* Technical Specifications */}
            <section aria-labelledby="technical-heading">
              <h2 id="technical-heading" className="text-2xl font-bold mb-6">
                Technical Specifications
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    Accessibility of VidChain relies on the following technologies to work with
                    the particular combination of web browser and any assistive technologies or
                    plugins installed on your computer:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground" role="list">
                    <li>• HTML5</li>
                    <li>• WAI-ARIA</li>
                    <li>• CSS</li>
                    <li>• JavaScript</li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    These technologies are relied upon for conformance with the accessibility
                    standards used.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Assessment Methods */}
            <section aria-labelledby="assessment-heading">
              <h2 id="assessment-heading" className="text-2xl font-bold mb-6">
                Assessment Methods
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  VidChain assesses the accessibility of this website through the following methods:
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground" role="list">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Self-evaluation using automated testing tools (axe, Lighthouse)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Manual testing with screen readers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Keyboard-only navigation testing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    Color contrast analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                    User feedback and testing
                  </li>
                </ul>
              </div>
            </section>

            {/* Statement Date */}
            <section aria-labelledby="date-heading" className="border-t pt-8">
              <p className="text-sm text-muted-foreground">
                <strong>This statement was created on:</strong> {currentDate}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Last reviewed:</strong> {currentDate}
              </p>
            </section>

            {/* CTA */}
            <section className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Need Assistance?</h2>
                <p className="mt-2 text-purple-100">
                  If you need help using our website or have accessibility questions,
                  we're here to help.
                </p>
                <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button
                    asChild
                    className="bg-white text-purple-600 hover:bg-purple-50"
                  >
                    <a href="mailto:accessibility@vidchain.io">
                      Contact Us
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <Link to="/help">
                      Help Center
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
