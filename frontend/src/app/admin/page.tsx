"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminHomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [active, setActive] = useState("overview");
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.replace("/");
        return;
      }
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      
      if (!adminEmail || userEmail !== adminEmail) {
        router.replace("/home");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handleMouseEnter = useCallback(() => {
    if (!locked) setExpanded(true);
  }, [locked]);

  const handleMouseLeave = useCallback(() => {
    if (!locked) setExpanded(false);
  }, [locked]);

  const handleLockToggle = useCallback(() => {
    setLocked((prev) => {
      if (!prev) setExpanded(true);
      return !prev;
    });
  }, []);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      {/* Sidebar hover zone */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex-shrink-0"
        style={{ width: expanded ? 180 : 56 }}
      >
        <AdminSidebar
          active={active}
          onActiveChange={setActive}
          expanded={expanded}
          onExpandChange={setExpanded}
          locked={locked}
          onLockToggle={handleLockToggle}
        />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/30">
          Welcome back to the command center.
        </p>

        {/* Active panel placeholder */}
        <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border border-emerald-500/[0.1] bg-emerald-500/[0.02]">
          <span className="text-sm text-emerald-500/40 capitalize">{active} Area</span>
        </div>
      </main>
    </div>
  );
}
