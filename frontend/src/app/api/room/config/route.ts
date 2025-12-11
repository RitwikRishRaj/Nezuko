import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Save room configuration
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      roomId, 
      questionCount, 
      minutes, 
      format, 
      minRating, 
      maxRating, 
      tags, 
      isRandomTags,
      problems,
      customProblemLinks,
      useCustomLinks
    } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Prepare the base configuration object
    const configData: any = {
      room_id: roomId,
      question_count: questionCount,
      minutes,
      format,
      min_rating: minRating,
      max_rating: maxRating,
      tags,
      is_random_tags: isRandomTags,
      problems,
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    // Only add custom link fields if they exist (for backward compatibility)
    if (customProblemLinks !== undefined) {
      configData.custom_problem_links = customProblemLinks;
    }
    if (useCustomLinks !== undefined) {
      configData.use_custom_links = useCustomLinks;
    }

    // Try to upsert with all fields first
    let { data, error } = await supabase
      .from('room_config')
      .upsert(configData, {
        onConflict: 'room_id'
      })
      .select()
      .single();

    // If error is due to missing columns, try without custom link fields
    if (error && (error.message?.includes('custom_problem_links') || error.message?.includes('use_custom_links'))) {
      console.log('Custom link columns not found, saving without them...');
      
      // Remove custom link fields and try again
      const { custom_problem_links, use_custom_links, ...baseConfigData } = configData;
      
      const fallbackResult = await supabase
        .from('room_config')
        .upsert(baseConfigData, {
          onConflict: 'room_id'
        })
        .select()
        .single();
      
      data = fallbackResult.data;
      error = fallbackResult.error;
      
      if (!error) {
        console.log('Room config saved without custom link fields');
      }
    }

    if (error) {
      console.error('Failed to save room config:', error);
      return NextResponse.json(
        { error: 'Failed to save room configuration', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error('Room config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get room configuration
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('room_config')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No config found
        return NextResponse.json(
          { error: 'Room configuration not found' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch room config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch room configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('Room config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
