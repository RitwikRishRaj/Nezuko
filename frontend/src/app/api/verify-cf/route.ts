import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  return NextResponse.json({ 
    status: 'API route working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { handle, contestId, index } = body;

    if (!handle || !contestId || !index) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL;
    
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend not configured' }, { status: 500 });
    }

    const verifyRes = await fetch(`${backendUrl}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, contestId, index }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      return NextResponse.json(
        { error: verifyData.message || 'Verification failed', success: false },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        codeforces_handle: handle,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select();

    if (updateError) {
      console.error('Failed to update user:', updateError);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verified',
      rating: verifyData.rating,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
