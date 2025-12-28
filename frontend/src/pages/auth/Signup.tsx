import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertWithIcon } from '@/components/ui/Alert';
import { ROUTES } from '@/config/constants';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

export function Signup() {
  const { register, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const result = await register(formData.email, formData.password, formData.fullName);
    if (result.success) {
      setSuccess(true);
    } else {
      setFormError(result.error || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We've sent a confirmation link to {formData.email}.
            <br />
            Click the link to activate your account.
          </p>
        </div>
        <Link to={ROUTES.login}>
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">
          Get started with VidChain for free
        </p>
      </div>

      {(formError || error) && (
        <AlertWithIcon variant="destructive" title="Error">
          {formError || error}
        </AlertWithIcon>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className="pl-9"
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email *
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password *
          </label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className="pl-9 pr-9"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password *
          </label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="pl-9"
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link to={ROUTES.login} className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
