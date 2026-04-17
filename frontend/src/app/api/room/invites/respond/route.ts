import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Get the user's auth token
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { roomId, response: inviteResponse } = body;

    // Validate required fields
    if (!roomId || !inviteResponse) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate response type
    if (!['accept', 'reject'].includes(inviteResponse)) {
      return NextResponse.json(
        { error: 'Invalid response type. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Forward the request to the backend API gateway
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/api/room/invites/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomId,
        response: inviteResponse
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Try to parse as JSON, fallback to error message
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: text || 'Backend error' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Room invite response API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
