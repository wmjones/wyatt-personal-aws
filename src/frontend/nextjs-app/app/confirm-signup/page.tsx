'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authService } from '../services/auth';

// Component that uses useSearchParams
function ConfirmSignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.confirmSignUp(email, code);

      if (result.success) {
        router.push('/login?confirmed=true');
      } else {
        setError(result.error || 'Failed to confirm email');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await authService.resendSignUp(email);

      if (result.success) {
        setError('Confirmation code resent to your email');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Confirm Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We&apos;ve sent a confirmation code to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`p-3 text-sm rounded-md ${
                error.includes('resent')
                  ? 'text-green-600 bg-green-100'
                  : 'text-red-600 bg-red-100'
              }`}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Confirmation Code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your email
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm">
            <button
              onClick={handleResendCode}
              className="text-primary hover:underline disabled:opacity-50"
              disabled={loading}
            >
              Resend confirmation code
            </button>

            <div>
              <Link
                href="/login"
                className="text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page Component with Suspense boundary
export default function ConfirmSignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
      <ConfirmSignUpContent />
    </Suspense>
  );
}
