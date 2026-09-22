import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import MongoDbClientService from '@/lib/mongodb';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

// Add this to handle OPTIONS requests for CORS
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const usersCollection = await MongoDbClientService.getCollection('users');
        const user = await usersCollection.findOne({ email });

        // Security: Always return success
        if (!user) {
            return NextResponse.json({ success: true });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetToken,
                    resetTokenExpiry,
                    updatedAt: new Date()
                }
            }
        );

        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const resetUrl = `${protocol}://${host}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        await sendPasswordResetEmail(email, resetUrl, user.name || 'User');

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}

// Add this to properly handle accidental GET requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        {
            status: 405,
            headers: {
                'Allow': 'POST, OPTIONS'
            }
        }
    );
}