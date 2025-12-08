import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's Codeforces handle and current rating
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('codeforces_handle, codeforces_rating')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch current rating from Codeforces API
    try {
      const response = await fetch(
        `https://codeforces.com/api/user.info?handles=${user.codeforces_handle}`
      );
      const data = await response.json();

      if (data.status !== 'OK' || !data.result || data.result.length === 0) {
        return NextResponse.json(
          { error: 'Failed to fetch rating from Codeforces' },
          { status: 500 }
        );
      }

      const newRating = data.result[0].rating || null;

      // Only update if rating has changed
      if (newRating === user.codeforces_rating) {
        return NextResponse.json({ 
          success: true, 
          rating: newRating,
          message: 'Rating unchanged',
          updated: false
        });
      }

      // Update rating in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          codeforces_rating: newRating,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId);

      if (updateError) {
        console.error('Failed to update rating:', updateError);
        return NextResponse.json(
          { error: 'Failed to update rating' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        rating: newRating,
        previousRating: user.codeforces_rating,
        message: 'Rating updated successfully',
        updated: true
      });

    } catch (cfError) {
      console.error('Codeforces API error:', cfError);
      return NextResponse.json(
        { error: 'Failed to fetch rating from Codeforces' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Update rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
