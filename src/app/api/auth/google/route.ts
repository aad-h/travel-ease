// File: app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Replace these values with your actual Google OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'login';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid email profile');
  
  // Generate a random state parameter to prevent CSRF attacks
  const randomState = Math.random().toString(36).substring(2);
  const state = `${mode}:${randomState}`;
  authUrl.searchParams.append('state', state);
  
  // Store the state in the session to verify it later
  // Note: In a real app, you'd use a more secure method for storing state
  
  // Return the authorization URL to the client for redirection
  return NextResponse.json({ url: authUrl.toString() });
}