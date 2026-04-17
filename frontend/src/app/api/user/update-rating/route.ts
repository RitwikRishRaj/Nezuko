import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    // Get the user's auth token
    const { getToken } = await auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward to backend API gateway
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/user/update-rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    // Read response as text first to handle rate limiting (plain text response)
    const responseText = await response.text()
    
    // Try to parse as JSON, handle rate limiting plain text response
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      // If not JSON, it's likely a rate limit or other plain text response
      data = { error: responseText || 'Request failed' }
    }
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in user update-rating API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
