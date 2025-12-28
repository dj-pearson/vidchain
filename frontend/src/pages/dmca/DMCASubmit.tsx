import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  FileText,
  CheckCircle,
  Shield,
  ExternalLink,
} from 'lucide-react';

interface DMCAFormData {
  // Content info
  contentUrl: string;
  contentDescription: string;

  // Claimant info
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantAddress: string;
  claimantCompany: string;
  isAuthorizedAgent: boolean;
  rightsOwnerName: string;

  // Copyright info
  copyrightedWorkDescription: string;
  copyrightedWorkUrl: string;
  copyrightRegistrationNumber: string;
  infringementDescription: string;

  // Required statements
  goodFaithStatement: boolean;
  accuracyStatement: boolean;
  authorizationStatement: boolean;

  // Signature
  signatureName: string;
}

const initialFormData: DMCAFormData = {
  contentUrl: '',
  contentDescription: '',
  claimantName: '',
  claimantEmail: '',
  claimantPhone: '',
  claimantAddress: '',
  claimantCompany: '',
  isAuthorizedAgent: false,
  rightsOwnerName: '',
  copyrightedWorkDescription: '',
  copyrightedWorkUrl: '',
  copyrightRegistrationNumber: '',
  infringementDescription: '',
  goodFaithStatement: false,
  accuracyStatement: false,
  authorizationStatement: false,
  signatureName: '',
};

export function DMCASubmit() {
  const [formData, setFormData] = useState<DMCAFormData>(initialFormData);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [claimNumber, setClaimNumber] = useState('');
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!formData.contentUrl && !!formData.contentDescription;
      case 2:
        return (
          !!formData.claimantName &&
          !!formData.claimantEmail &&
          !!formData.claimantAddress &&
          (!formData.isAuthorizedAgent || !!formData.rightsOwnerName)
        );
      case 3:
        return (
          !!formData.copyrightedWorkDescription &&
          !!formData.infringementDescription
        );
      case 4:
        return (
          formData.goodFaithStatement &&
          formData.accuracyStatement &&
          formData.authorizationStatement &&
          !!formData.signatureName
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Extract content ID from URL (simplified - would need proper parsing)
      const urlMatch = formData.contentUrl.match(/\/(videos|marketplace)\/([a-zA-Z0-9-]+)/);
      const contentId = urlMatch?.[2] || 'unknown';
      const contentType = urlMatch?.[1] === 'marketplace' ? 'listing' : 'video';

      const response = await fetch('/api/dmca/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          contentUrl: formData.contentUrl,
          claimantName: formData.claimantName,
          claimantEmail: formData.claimantEmail,
          claimantPhone: formData.claimantPhone,
          claimantAddress: formData.claimantAddress,
          claimantCompany: formData.claimantCompany,
          isAuthorizedAgent: formData.isAuthorizedAgent,
          rightsOwnerName: formData.rightsOwnerName,
          copyrightedWorkDescription: formData.copyrightedWorkDescription,
          copyrightedWorkUrl: formData.copyrightedWorkUrl,
          copyrightRegistrationNumber: formData.copyrightRegistrationNumber,
          infringementDescription: formData.infringementDescription,
          goodFaithStatement: formData.goodFaithStatement,
          accuracyStatement: formData.accuracyStatement,
          authorizationStatement: formData.authorizationStatement,
          signatureName: formData.signatureName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit DMCA notice');
      }

      setClaimNumber(data.claimNumber);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                DMCA Notice Submitted
              </h2>
              <p className="text-slate-400 mb-4">
                Your claim number is:
              </p>
              <Badge className="bg-blue-500/10 text-blue-400 text-lg px-4 py-2 mb-6">
                {claimNumber}
              </Badge>
              <p className="text-slate-400 mb-6">
                We will review your claim and respond within 1-2 business days.
                You will receive an acknowledgment email shortly.
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            DMCA Takedown Notice
          </h1>
          <p className="text-slate-400">
            Submit a copyright infringement claim under the Digital Millennium Copyright Act
          </p>
        </div>

        {/* Warning */}
        <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-400 font-semibold mb-1">
                  Before You Submit
                </p>
                <p className="text-yellow-300/80">
                  Filing a false DMCA notice may result in legal liability under 17 U.S.C. 512(f).
                  Please ensure you are the copyright owner or authorized to act on their behalf,
                  and that the use is not fair use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 1 && 'Identify Infringing Content'}
              {step === 2 && 'Your Contact Information'}
              {step === 3 && 'Copyright Details'}
              {step === 4 && 'Statements & Signature'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Content Identification */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL of Infringing Content *
                  </label>
                  <input
                    type="url"
                    name="contentUrl"
                    value={formData.contentUrl}
                    onChange={handleChange}
                    placeholder="https://vidchain.io/videos/..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Provide the direct URL to the content on VidChain
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description of Infringing Content *
                  </label>
                  <textarea
                    name="contentDescription"
                    value={formData.contentDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the content that infringes your copyright..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="claimantName"
                      value={formData.claimantName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="claimantEmail"
                      value={formData.claimantEmail}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="claimantPhone"
                      value={formData.claimantPhone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      name="claimantCompany"
                      value={formData.claimantCompany}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mailing Address *
                  </label>
                  <textarea
                    name="claimantAddress"
                    value={formData.claimantAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAuthorizedAgent"
                      checked={formData.isAuthorizedAgent}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-slate-500 bg-slate-600 text-blue-600"
                    />
                    <span className="text-slate-300">
                      I am an authorized agent acting on behalf of the copyright owner
                    </span>
                  </label>
                  {formData.isAuthorizedAgent && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Copyright Owner Name *
                      </label>
                      <input
                        type="text"
                        name="rightsOwnerName"
                        value={formData.rightsOwnerName}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        required={formData.isAuthorizedAgent}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Copyright Details */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description of Copyrighted Work *
                  </label>
                  <textarea
                    name="copyrightedWorkDescription"
                    value={formData.copyrightedWorkDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the original copyrighted work that you own..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL of Original Work
                  </label>
                  <input
                    type="url"
                    name="copyrightedWorkUrl"
                    value={formData.copyrightedWorkUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    If available, provide a link to the original work
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Copyright Registration Number
                  </label>
                  <input
                    type="text"
                    name="copyrightRegistrationNumber"
                    value={formData.copyrightRegistrationNumber}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Optional but helpful if you have registered the copyright
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    How Does This Content Infringe Your Copyright? *
                  </label>
                  <textarea
                    name="infringementDescription"
                    value={formData.infringementDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Explain how the content on VidChain infringes your copyright..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            {/* Step 4: Statements & Signature */}
            {step === 4 && (
              <>
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-4">
                    Under penalty of perjury, I confirm the following statements:
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      name="goodFaithStatement"
                      checked={formData.goodFaithStatement}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-600 text-blue-600"
                      required
                    />
                    <span className="text-slate-300 text-sm">
                      I have a good faith belief that the use of the material in the manner
                      complained of is not authorized by the copyright owner, its agent, or the law. *
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      name="accuracyStatement"
                      checked={formData.accuracyStatement}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-600 text-blue-600"
                      required
                    />
                    <span className="text-slate-300 text-sm">
                      The information in this notification is accurate, and under penalty of
                      perjury, I am the owner or authorized to act on behalf of the owner of
                      an exclusive right that is allegedly infringed. *
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      name="authorizationStatement"
                      checked={formData.authorizationStatement}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-600 text-blue-600"
                      required
                    />
                    <span className="text-slate-300 text-sm">
                      I understand that filing a false DMCA notice may result in legal liability
                      for damages under 17 U.S.C. 512(f). *
                    </span>
                  </label>
                </div>
                <div className="border-t border-slate-700 pt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Electronic Signature (Type Your Full Name) *
                  </label>
                  <input
                    type="text"
                    name="signatureName"
                    value={formData.signatureName}
                    onChange={handleChange}
                    placeholder="Type your full legal name"
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    By typing your name, you are electronically signing this DMCA notice
                  </p>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-700">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-slate-600"
                >
                  Previous
                </Button>
              ) : (
                <div />
              )}
              {step < 4 ? (
                <Button
                  onClick={() => {
                    if (validateStep(step)) {
                      setStep(step + 1);
                      setError('');
                    } else {
                      setError('Please complete all required fields');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit DMCA Notice'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Links */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <a href="/dmca/policy" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
            View our DMCA Policy <ExternalLink className="h-3 w-3" />
          </a>
          <span className="mx-2">|</span>
          <a href="/help/fair-use" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
            Learn about Fair Use <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default DMCASubmit;
