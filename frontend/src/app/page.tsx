'use client';

import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome to Nezuko</h1>
        {isSignedIn && user ? (
          <div className="space-y-4">
            <p className="text-lg">Hello, {user.firstName}!</p>
            <p>Your account is synced with Supabase.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg">Please sign in to continue</p>
            <div className="flex space-x-4">
              <a
                href="/sign-in"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}