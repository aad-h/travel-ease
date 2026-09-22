import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/mongodb/users';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Invalid JSON in request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body. JSON parsing failed.' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate the user
    const result = await authenticateUser(email, password);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Return user data (excluding sensitive information)
    return NextResponse.json({ 
      success: true,
      user: result.user
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login', details: error.message },
      { status: 500 }
    );
  }
}