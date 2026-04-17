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
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
      >
        <path d="M15 12.9a5 5 0 1 0 -3.902 -3.9" />
        <path d="M15 12.9l-3.902 -3.899l-7.513 8.584a2 2 0 1 0 2.827 2.83l8.588 -7.515z" />
      </svg>
    ),
  },
  {
    label: "Inbox",
    href: "/admin/inbox",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
      >
        <path
          d="M9 3.75H6.91179C5.92403 3.75 5.05178 4.39423 4.76129 5.33831L2.3495 13.1766C2.28354 13.391 2.25 13.614 2.25 13.8383V18C2.25 19.2426 3.25736 20.25 4.5 20.25H19.5C20.7426 20.25 21.75 19.2426 21.75 18V13.8383C21.75 13.614 21.7165 13.391 21.6505 13.1766L19.2387 5.33831C18.9482 4.39423 18.076 3.75 17.0882 3.75H15M2.25 13.5H6.10942C6.96166 13.5 7.74075 13.9815 8.12188 14.7438L8.37812 15.2562C8.75925 16.0185 9.53834 16.5 10.3906 16.5H13.6094C14.4617 16.5 15.2408 16.0185 15.6219 15.2562L15.8781 14.7438C16.2592 13.9815 17.0383 13.5 17.8906 13.5H21.75M12 3V11.25M12 11.25L9 8.25M12 11.25L15 8.25"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
