import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('=== Sync User API Called ===');
  
  try {
    // Authenticate user
    const { userId, sessionClaims } = await auth();
    console.log('Authenticated user ID:', userId);

    if (!userId) {
      console.log('No user ID - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get email from session claims
    const emailAddresses = (sessionClaims as any)?.emailAddresses;
    const email = (sessionClaims as any)?.email || 
                  (emailAddresses && emailAddresses[0]?.emailAddress) ||
                  `${userId}@temp.local`;
    
    console.log('User email:', email);

    if (!email) {
      console.error('No email found for user');
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!existingUser) {
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email,
          codeforces_handle: '',
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase INSERT error:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create user',
          details: insertError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        action: 'created',
        user: insertData 
      });
    } else {
      if (existingUser.email !== email) {
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            email,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', userId)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update user' 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          user: updateData 
        });
      }

      return NextResponse.json({ 
        success: true, 
        action: 'already_synced',
        user: existingUser 
      });
    }
  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
