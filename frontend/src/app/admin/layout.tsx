'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  IconSettings,
  IconUsers,
  IconFileText,
  IconActivity,
  IconUserBolt,
  IconShieldLock,
  IconChartBar,
  IconListCheck,
  IconUserPlus,
  IconDatabase
} from "@tabler/icons-react";
import LightRays from '@/components/ui/LightRays';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const links = [
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <IconChartBar className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: "Event Board",
    href: "/admin/event-board",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Live Event",
    href: "/admin/live-event",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },

  {
    label: "Announcement",
    href: "/admin/announcement",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/admin/leaderboard",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const Logo = ({ open }: { open: boolean }) => {
  return (
    <a
      href="/admin"
      className={cn(
        "relative z-20 flex items-center py-4 text-sm font-normal text-white dark:text-white min-w-0 flex-nowrap overflow-hidden",
        open ? "space-x-2 justify-start" : "justify-center"
      )}
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center min-w-[32px] min-h-[32px]">
        <span className="text-white font-bold text-sm">A</span>
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <motion.span
            initial={{ 
              opacity: 0, 
              x: -20,
              scale: 0.8
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              x: -20,
              scale: 0.8
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.6,
              opacity: { duration: 0.2 },
              x: { duration: 0.3 },
              scale: { duration: 0.25 }
            }}
            className="font-medium whitespace-nowrap text-white dark:text-white text-xl flex-shrink-0 min-w-0"
          >
            Admin Panel
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="/admin"
      className="relative z-20 flex items-center justify-center py-4 min-w-0 flex-nowrap"
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center min-w-[32px] min-h-[32px]">
        <span className="text-white font-bold text-sm">A</span>
      </div>
    </a>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}>
      <div 
        className="flex h-full"
        style={{
          backgroundColor: "#161928"
        }}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody 
            className="justify-between gap-10 shadow-lg h-full rounded-r-xl"
            style={{
              background: "linear-gradient(to bottom, #1b1b32 0%, #2c1b32 50%, #5c1b3e 100%)"
            }}
          >
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {open ? <Logo open={open} /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div className="mt-auto">
              <SidebarLink
                link={{
                  label: "Admin Account",
                  href: "/admin/account",
                  icon: (
                    <IconUserBolt className="h-5 w-5 shrink-0 text-white" />
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto h-full relative">
          {/* LightRays background */}
          <div className="absolute inset-0">
            <LightRays
              raysOrigin="top-center"
              raysColor="#00ffff"
              raysSpeed={1.5}
              lightSpread={0.8}
              rayLength={1.2}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0.1}
              distortion={0.05}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
          <div className="relative z-10 p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
