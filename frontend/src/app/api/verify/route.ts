import { NextResponse } from 'next/server';

const VERIFICATION_SERVICE_URL = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:3001/verify-codeforces';

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    
    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Codeforces handle is required' },
        { status: 400 }
      );
    }

    const response = await fetch(VERIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ handle: handle.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Verification failed' },
        { status: response.status }
      );
    }

    // Return the response from the verification service
    return NextResponse.json({
      success: data.success,
      message: data.message,
      ...(data.submissionId && { submissionId: data.submissionId }),
      ...(data.rating !== undefined && { rating: data.rating })
    });

  } catch (error) {
    console.error('Verification API error:', error);
    
    // Check if it's a connection error
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isConnectionError = errorMessage.includes('ECONNREFUSED') || 
                              errorMessage.includes('fetch failed') ||
                              errorMessage.includes('Failed to fetch');
    
    return NextResponse.json(
      { 
        success: false, 
        error: isConnectionError 
          ? `Verification service is not available. Please make sure the verification service is running. Expected URL: ${VERIFICATION_SERVICE_URL}`
          : errorMessage
      },
      { status: 500 }
    );
  }
}
