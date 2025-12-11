import { NextResponse } from 'next/server';

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:3001/questions/fetch';

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

    const response = await fetch(`${QUESTION_SERVICE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch questions from service');
    }

    const data = await response.json();

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
          ? `Question service is not available. Please make sure the question service is running at ${QUESTION_SERVICE_URL}`
          : errorMessage,
        problems: []
      },
      { status: 500 }
    );
  }
}
