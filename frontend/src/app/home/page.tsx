"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ArenaContent from "@/components/ArenaContent";
import GlobalChat, { InlineGlobalChat } from "@/components/GlobalChat";

export default function HomePage() {
  const [active, setActive] = useState("arena");
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPinned, setChatPinned] = useState(false);

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

  const isChat = active === "globalchat";

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-white">
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

      {/* Main content area — overflow-hidden so the PAGE never scrolls */}
      <main
        className={`flex flex-1 flex-col min-h-0 transition-all duration-300 ${
          isChat ? "overflow-hidden" : "overflow-y-auto p-8"
        }`}
        style={{ marginRight: chatOpen && chatPinned && !isChat ? 360 : 0 }}
      >
        {/* Header — hidden on globalchat to give chat full height */}
        {!isChat && (
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Home</h1>
            <p className="mt-1 text-sm text-white/30">Welcome back. Select a section from the sidebar.</p>
          </div>
        )}

        {active === "arena" ? (
          <div className="mt-8">
            <ArenaContent />
          </div>
        ) : active === "globalchat" ? (
          <div className="flex flex-1 min-h-0 p-4">
            <InlineGlobalChat myName="you" />
          </div>
        ) : (
          <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02]">
            <span className="text-sm text-white/20 capitalize">{active}</span>
          </div>
        )}
      </main>

      {/* Global Chat drawer */}
      <GlobalChat
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        pinned={chatPinned}
        onTogglePin={() => setChatPinned((v) => !v)}
        hidden={isChat}
      />
    </div>
  );
}
