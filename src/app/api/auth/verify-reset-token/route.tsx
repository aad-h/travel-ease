import { NextRequest, NextResponse } from 'next/server';
import MongoDbClientService from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, email } = body;

        if (!token || !email) {
            return NextResponse.json(
                { error: 'Token and email are required' },
                { status: 400 }
            );
        }

        const usersCollection = await MongoDbClientService.getCollection('users');
        const user = await usersCollection.findOne({
            email,
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return NextResponse.json(
                { valid: false, error: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });

    } catch (error: any) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}