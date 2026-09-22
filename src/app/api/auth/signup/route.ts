import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/utils';
import MongoDbClientService from '@/lib/mongodb/index';

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
    
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get users collection
    const usersCollection = await MongoDbClientService.getCollection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      name: name || '',
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Return success (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        email,
        name: name || '',
      }
    });

  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup', details: error.message },
      { status: 500 }
    );
  }
} 