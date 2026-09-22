'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // prevent default form submission
        setIsLoading(true);
        setMessage('');
        setIsError(false);
        setIsSuccess(false);

        try {
            // Make a POST request to the API endpoint
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // show as success 
            setIsSuccess(true);
            setMessage('If that email exists in our system, you will receive password reset instructions shortly.');
            setEmail(''); // clear 
        } catch (error: any) {
            console.error('Forgot password error:', error);
            setIsError(true);
            setMessage(error.message || 'Failed to process your request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">TravelEase</h1>
                <p className="text-gray-600 mt-2">Reset your password</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
                {message && (
                    <div className={`mb-4 p-3 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {!isSuccess ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <p className="mb-4">Check your email for the password reset link.</p>
                        <button
                            onClick={() => {
                                setIsSuccess(false);
                                setMessage('');
                            }}
                            className="text-blue-600 hover:underline"
                        >
                            Request another reset link
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center text-sm">
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}