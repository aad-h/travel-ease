'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('error');
    const messages: Record<string, string> = {
      google_not_configured: 'Google sign-in is not configured yet.',
      invalid_oauth_state: 'Google sign-in expired or could not be verified. Please try again.',
      auth_failed: 'Google could not complete sign-in. Check the OAuth client and redirect URI.',
      profile_failed: 'Google signed you in, but your profile could not be loaded.',
      auth_error: 'Google sign-in could not be completed.'
    };
    if (errorCode) setError(messages[errorCode] || 'Google sign-in failed. Please try again.');
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await auth.login(email, password);
      if (result.success) router.push('/dashboard');
      else setError(result.error || 'Login failed. Please try again.');
    } catch (loginError) {
      console.error(loginError);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await auth.googleAuth('login');
      if (!result.success) setError(result.error || 'Google login failed. Please try again.');
    } catch (googleError) {
      console.error(googleError);
      setError('An unexpected error occurred with Google login. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.45),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(16,185,129,0.25),transparent_35%)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-blue-700">T</span>
          <span className="text-xl font-bold">TravelEase</span>
        </div>
        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Your whole trip, one clear plan</div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">Go from “somewhere” to a day-by-day itinerary.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Balance budget, interests, hidden gems, food, and travel pace—without starting from a blank page.</p>
          <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
            {['Personalized days', 'Map-ready stops', 'No paid AI calls'].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200"><span className="mb-3 block text-emerald-400">✓</span>{item}</div>)}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">Plan thoughtfully. Verify live hours, prices, and availability with the provider.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">T</span><span className="text-xl font-bold text-slate-950">TravelEase</span></div>
          </div>
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Continue planning</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to open your trips and itinerary workspace.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{error}</div>}

            <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50">
              <GoogleIcon /> {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>

            <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">or use email</span><div className="h-px flex-1 bg-slate-200" /></div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required placeholder="you@example.com" autoComplete="email" /></div>
              <div>
                <div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label><Link href="/auth/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link></div>
                <input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required placeholder="Enter your password" autoComplete="current-password" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{loading ? 'Signing in…' : 'Sign in'}</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">New to TravelEase? <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">Create an account</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.29-2.66l-3.57-2.77c-.99.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.82 6.07L5.84 9.9A6.58 6.58 0 0 1 12 5.38Z"/></svg>;
}
