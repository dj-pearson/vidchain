import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertWithIcon } from '@/components/ui/Alert';
import { ROUTES } from '@/config/constants';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Generate unique IDs for accessibility
  const formErrorId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setFormError(result.error || 'Login failed');
    }
  };

  const emailError = touched.email && !formData.email ? 'Email is required' : null;
  const passwordError = touched.password && !formData.password ? 'Password is required' : null;
  const displayError = formError || error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your VidChain account
        </p>
      </div>

      {displayError && (
        <AlertWithIcon
          variant="destructive"
          title="Error"
          id={formErrorId}
          role="alert"
          aria-live="assertive"
        >
          {displayError}
        </AlertWithIcon>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-describedby={displayError ? formErrorId : undefined}
        noValidate
      >
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <div className="relative mt-1">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              className="pl-9"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={emailError ? 'true' : undefined}
              aria-describedby={emailError ? emailErrorId : undefined}
            />
          </div>
          {emailError && (
            <p id={emailErrorId} className="mt-1 text-sm text-destructive" role="alert">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              placeholder="Enter your password"
              className="pl-9 pr-10"
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={passwordError ? 'true' : undefined}
              aria-describedby={passwordError ? passwordErrorId : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {passwordError && (
            <p id={passwordErrorId} className="mt-1 text-sm text-destructive" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link
          to={ROUTES.signup}
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
