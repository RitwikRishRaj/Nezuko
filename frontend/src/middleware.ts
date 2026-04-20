import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/', '/api(.*)']);
const isVerifyRoute = createRouteMatcher(['/verify(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const authResult = await auth();
  const userId = authResult.userId;
  const sessionClaims = authResult.sessionClaims;

  // Allow public routes (including webhooks)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to landing page if not authenticated
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Check admin role from metadata in session token
  const metadata = (sessionClaims as any)?.metadata;
  const isAdmin = metadata?.role === 'admin';

  // Admin route protection
  if (isAdminRoute(req)) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  // Check if user exists and is verified in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user, error } = await supabase
    .from('users')
    .select('clerk_id, is_verified')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase query error:', error);
  }

  // If user doesn't exist in Supabase, create them (fallback for webhook failures)
  if (!user) {
    console.log('User not found in DB, creating fallback entry:', userId);
    
    // Get email from Clerk - try multiple sources
    const emailAddresses = (sessionClaims as any)?.emailAddresses;
    const email = (sessionClaims as any)?.email || 
                  (sessionClaims as any)?.primaryEmail || 
                  (emailAddresses && emailAddresses[0]?.emailAddress) ||
                  `${userId}@temp.local`; // Fallback
    
    console.log('Using email:', email);
    
    const { data: insertData, error: insertError } = await supabase.from('users').insert({
      clerk_id: userId,
      email: email as string,
      codeforces_handle: '',
      is_verified: isAdmin, // Admins are auto-verified
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select();
    
    console.log('User insert result:', { insertData, insertError });
    
    if (insertError) {
      console.error('Failed to create user:', insertError);
    }

    // Admins skip verification, go to admin panel
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // Regular users go to verify page
    if (!isVerifyRoute(req)) {
      return NextResponse.redirect(new URL('/verify', req.url));
    }
    return NextResponse.next();
  }

  // Admins skip verification check - they can access home or admin
  if (isAdmin) {
    if (isVerifyRoute(req)) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // If user is not verified, redirect to verify page
  if (!user.is_verified && !isVerifyRoute(req)) {
    return NextResponse.redirect(new URL('/verify', req.url));
  }

  // If user is verified but trying to access verify page, redirect to home
  if (user.is_verified && isVerifyRoute(req)) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // If user is verified and accessing home or other protected routes, allow
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};