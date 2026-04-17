import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    let url = `${backendUrl}/api/arena/session/${roomId}/submissions`
    if (participantId) {
      url += `?participantId=${participantId}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    const responseText = await response.text()
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { error: responseText || 'Request failed' }
    }
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in arena session submissions API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
