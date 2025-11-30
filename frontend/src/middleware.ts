import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/']);
const isVerifyRoute = createRouteMatcher(['/verify(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes and API routes
  if (isPublicRoute(req) || isApiRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check if user exists in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user, error } = await supabase
    .from('users')
    .select('id, is_verified')
    .eq('clerk_id', userId)
    .single();

  // Log for debugging
  if (error && error.code !== 'PGRST116') {
    console.error('Supabase query error:', error);
  }

  // If user doesn't exist in Supabase, redirect to verify page
  if (!user && !isVerifyRoute(req)) {
    console.log('User not found in DB, redirecting to verify:', userId);
    return NextResponse.redirect(new URL('/verify', req.url));
  }

  // If user exists but trying to access verify page, redirect to dashboard
  if (user && isVerifyRoute(req)) {
    console.log('User found in DB, redirecting to dashboard:', userId);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

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