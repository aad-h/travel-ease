'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const router = useRouter();

    useEffect(() => {
        // Verify token validity on component mount
        verifyToken();
    }, []);

    const verifyToken = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/verify-reset-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid or expired token');
            }

            setIsValid(true);
        } catch (error: any) {
            console.error('Token verification error:', error);
            setIsValid(false);
            setIsError(true);
            setMessage(error.message || 'This reset link is invalid or has expired. Please request a new one.');
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
            setMessage('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setIsSuccess(true);
            setMessage('Password successfully reset!');

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error: any) {
            console.error('Reset password error:', error);
            setIsError(true);
            setMessage(error.message || 'Failed to reset your password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isValid === null) {
        return (
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">TravelEase</h1>
                    <p className="text-gray-600 mt-2">Verifying your reset link...</p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (isValid === false) {
        return (
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">TravelEase</h1>
                    <p className="text-gray-600 mt-2">Password Reset</p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {message}
                    </div>
                    <Link
                        href="/auth/forgot-password"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block text-center"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">TravelEase</h1>
                    <p className="text-gray-600 mt-2">Password Reset Complete</p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {message}
                    </div>
                    <p className="text-center text-gray-600">Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">TravelEase</h1>
                <p className="text-gray-600 mt-2">Reset Your Password</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
                {message && (
                    <div className={`mb-4 p-3 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="Enter new password"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="Confirm new password"
                            minLength={8}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}