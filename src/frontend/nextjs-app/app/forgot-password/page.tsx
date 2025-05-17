'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setStep('reset');
      } else {
        setError(result.error || 'Failed to request password reset');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.forgotPasswordSubmit(email, code, newPassword);

      if (result.success) {
        router.push('/login?reset=true');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              {step === 'request' ? 'Forgot Password' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === 'request'
                ? "Enter your email and we'll send you a reset code"
                : "Enter the code from your email and new password"
              }
            </p>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Reset Code
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

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
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
  );
}
