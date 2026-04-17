import { NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    
    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Codeforces handle is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_GATEWAY_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ handle: handle.trim() }),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, get the text response for debugging
      const textResponse = await response.text();
      console.error('Backend returned non-JSON response:', textResponse);
      throw new Error('Backend service returned invalid response');
    }

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
          ? `API Gateway is not available. Please make sure the backend services are running at ${API_GATEWAY_URL}`
          : errorMessage
      },
      { status: 500 }
    );
  }
}
