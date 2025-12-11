import { NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const rating = searchParams.get('rating');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const tags = searchParams.get('tags');
    const count = searchParams.get('count') || '5';

    // Build query params for question service
    const params = new URLSearchParams({ count });
    
    if (rating) {
      params.append('rating', rating);
    } else if (minRating || maxRating) {
      if (minRating) params.append('minRating', minRating);
      if (maxRating) params.append('maxRating', maxRating);
    }
    
    if (tags) {
      params.append('tags', tags);
    }

    const response = await fetch(`${API_GATEWAY_URL}/api/questions/fetch?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch questions from service');
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, get the text response for debugging
      const textResponse = await response.text();
      console.error('Backend returned non-JSON response:', textResponse);
      throw new Error('Backend service returned invalid response');
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Questions API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isConnectionError = errorMessage.includes('ECONNREFUSED') || 
                              errorMessage.includes('fetch failed') ||
                              errorMessage.includes('Failed to fetch');
    
    return NextResponse.json(
      { 
        error: isConnectionError 
          ? `API Gateway is not available. Please make sure the backend services are running at ${API_GATEWAY_URL}`
          : errorMessage,
        problems: []
      },
      { status: 500 }
    );
  }
}
