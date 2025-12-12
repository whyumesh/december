/**
 * Test Email Configuration API
 * 
 * Endpoint to test Gmail SMTP configuration
 * Useful for debugging authentication issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyConnection, testEmailConfiguration } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'verify'; // 'verify' or 'test'

    if (action === 'test') {
      // Test sending an email
      const result = await testEmailConfiguration();
      return NextResponse.json(result, { 
        status: result.success ? 200 : 500 
      });
    } else {
      // Just verify connection
      const result = await verifyConnection();
      return NextResponse.json(result, { 
        status: result.success ? 200 : 500 
      });
    }
  } catch (error: any) {
    console.error('❌ Test email API error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to test email configuration',
    }, { status: 500 });
  }
}

