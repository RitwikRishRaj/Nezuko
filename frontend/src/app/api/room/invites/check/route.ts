import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get the user's auth token
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward the request to the backend API gateway
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/api/room/invites/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', invites: [] },
        { status: 429 }
      );
    }

    // Try to parse as JSON, fallback to error message
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response (likely rate limit or error message)
      return NextResponse.json(
        { error: text || 'Backend error', invites: [] },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Room invite check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', invites: [] },
      { status: 500 }
    );
  }
}
