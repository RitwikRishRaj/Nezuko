"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";

export default function HomePage() {
  const [active, setActive] = useState("arena");
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!locked) setExpanded(true);
  }, [locked]);

  const handleMouseLeave = useCallback(() => {
    if (!locked) setExpanded(false);
  }, [locked]);

  const handleLockToggle = useCallback(() => {
    setLocked((prev) => {
      // When locking, keep sidebar expanded; when unlocking, collapse it
      if (!prev) setExpanded(true);
      return !prev;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      {/* Sidebar hover zone */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex-shrink-0"
        style={{ width: expanded ? 180 : 56 }}
      >
        <Sidebar
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
          Home
        </h1>
        <p className="mt-1 text-sm text-white/30">
          Welcome back. Select a section from the sidebar.
        </p>

        {/* Active panel placeholder */}
        <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <span className="text-sm text-white/20 capitalize">{active}</span>
        </div>
      </main>
    </div>
  );
}
