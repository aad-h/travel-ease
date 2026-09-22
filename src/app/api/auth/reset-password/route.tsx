import { NextRequest, NextResponse } from 'next/server';
import MongoDbClientService from '@/lib/mongodb';
import { hashPassword } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, email, password } = body;

        if (!token || !email || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
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
                { error: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword, updatedAt: new Date() },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}