'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Loading component to display while suspense is resolving
function Loading() {
  return <div className="text-center p-8">Loading...</div>;
}

// Main component that uses searchParams
function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        const emailParam = searchParams.get('email');

        if (tokenParam && emailParam) {
            setToken(tokenParam);
            setEmail(emailParam);
            verifyToken(tokenParam, emailParam);
        } else {
            setIsValid(false);
            setIsError(true);
            setMessage('Invalid reset link');
        }
    }, [searchParams]);

    const verifyToken = async (token: string, email: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/verify-reset-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email }),
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }
            setIsValid(true);
        } catch (error) {
            setIsValid(false);
            setIsError(true);
            setMessage('This link is invalid or expired');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setIsError(true);
            setMessage('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setIsError(true);
            setMessage('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, password }),
            });

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            setIsSuccess(true);
            setMessage('Password reset successfully!');
            setTimeout(() => router.push('/login'), 2000);
        } catch (error) {
            setIsError(true);
            setMessage('Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isValid === null) {
        return <div className="text-center p-8">Verifying link...</div>;
    }

    if (isValid === false) {
        return (
            <div className="max-w-md mx-auto p-4">
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {message}
                </div>
                <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                    Request new reset link
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto p-4">
                <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
                    {message}
                </div>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

            {message && (
                <div className={`p-4 rounded mb-4 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                        minLength={8}
                    />
                </div>

                <div>
                    <label className="block mb-1">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                        minLength={8}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

// Main page component that wraps the form in Suspense
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ResetPasswordForm />
        </Suspense>
    );
}