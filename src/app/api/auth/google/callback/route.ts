import { NextRequest, NextResponse } from 'next/server';
import MongoDbClientService from '@/lib/mongodb/index';
import { generateAuthToken } from '@/lib/utils';

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const returnedState = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('google_oauth_state')?.value;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));
  }

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_oauth_state', request.url));
  }
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
    
    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    const profile = await profileResponse.json();
    
    if (!profileResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=profile_failed', request.url));
    }
    
    // Handle user in database
    const usersCollection = await MongoDbClientService.getCollection('users');
    const existingUser = await usersCollection.findOne({ email: profile.email });
    
    let userId;
    
    if (existingUser) {
      // Update existing user if needed
      if (!existingUser.googleId) {
        await usersCollection.updateOne(
          { _id: existingUser._id },
          { 
            $set: { 
              googleId: profile.sub,
              picture: existingUser.picture || profile.picture,
              updatedAt: new Date()
            } 
          }
        );
      }
      userId = existingUser._id;
    } else {
      // Create new user
      const result = await usersCollection.insertOne({
        email: profile.email,
        name: profile.name,
        googleId: profile.sub,
        picture: profile.picture,
        emailVerified: true,
        createdAt: new Date(),
      });
      
      userId = result.insertedId;
    }
    
    // Get final user data and generate token
    const user = await usersCollection.findOne({ _id: userId });
    const token = generateAuthToken(user);

    const userData = {
      _id: user?._id.toString(),
      email: user?.email,
      name: user?.name,
      picture: user?.picture,
      googleId: user?.googleId,
      emailVerified: user?.emailVerified,
      createdAt: user?.createdAt,
      token: token
    };

    const encodedUserData = Buffer.from(JSON.stringify(userData)).toString('base64url');
    const response = NextResponse.redirect(new URL(`/AuthCompletion?data=${encodedUserData}`, request.url));
    response.cookies.delete('google_oauth_state');
    return response;
    
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
}
