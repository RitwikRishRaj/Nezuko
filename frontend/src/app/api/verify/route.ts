import { NextResponse } from 'next/server';

const VERIFICATION_SERVICE_URL = 'http://localhost:3001/verify-codeforces';

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.error || 'Verification failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: data.success,
      message: data.message,
      ...(data.submissionId && { submissionId: data.submissionId })
    });

  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
