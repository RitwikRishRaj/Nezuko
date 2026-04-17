"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { isAdminEmail, getAdminRedirectUrl } from "@/lib/admin-utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    
    if (isAdminEmail(userEmail)) {
      router.push(getAdminRedirectUrl());
    } else {
      router.push('/dashboard/arena-choose');
    }
  }, [router, user, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = isAdminEmail(userEmail);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">
        {isAdmin ? 'Redirecting to Admin Panel...' : 'Redirecting to Arena...'}
      </div>
    </div>
  );
}
