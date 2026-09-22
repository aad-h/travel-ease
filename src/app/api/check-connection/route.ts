import { NextResponse } from 'next/server';
import MongoDbClientService from '@/lib/mongodb/index';

export async function GET() {
  try {
    // Try to connect to MongoDB 
    const isConnected = await MongoDbClientService.isConnected();
    
    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully connected to MongoDB' 
      });
    } else {
      const error = MongoDbClientService.getConnectionError();
      return NextResponse.json({ 
        success: false, 
        error: error || 'Could not connect to MongoDB'
      });
    }
  } catch (error: any) {
    console.error('Connection check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to check database connection' 
    });
  }
} 