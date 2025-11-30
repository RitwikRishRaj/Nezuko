'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import {
  IconSettings,
  IconUsers,
  IconFileText,
  IconActivity,
  IconUserBolt,
} from "@tabler/icons-react";

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
    label: "Arena",
    href: "/dashboard",
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
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" x2="19" y1="19" y2="13" />
        <line x1="16" x2="20" y1="16" y2="20" />
        <line x1="19" x2="21" y1="21" y2="19" />
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        <line x1="5" x2="9" y1="14" y2="18" />
        <line x1="7" x2="4" y1="17" y2="20" />
        <line x1="3" x2="5" y1="19" y2="21" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/dashboard/leaderboard",
    icon: (
      <svg 
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
        <path d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
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
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Activity",
    href: "/dashboard/activity",
    icon: <IconActivity className="h-5 w-5 shrink-0 text-white" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <IconSettings className="h-5 w-5 shrink-0 text-white" />,
  },
];

const Logo = ({ open }: { open: boolean }) => {
  return (
    <a
      href="/dashboard"
      className={cn(
        "relative z-20 flex items-center py-4 text-sm font-normal text-white dark:text-white min-w-0 flex-nowrap overflow-hidden",
        open ? "space-x-2 justify-start" : "justify-center"
      )}
    >
      <div className="flex-shrink-0">
        <Image
          src="/algogym_logo.svg"
          alt="Algogym Logo"
          width={open ? 120 : 32}
          height={open ? 40 : 32}
          className={open ? "h-8 w-auto" : "h-8 w-8"}
          priority
        />
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
            AlgoGym
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center justify-center py-4 min-w-0 flex-nowrap"
    >
      <Image
        src="/algogym_logo.svg"
        alt="AlgoGym"
        width={32}
        height={32}
        className="h-8 w-8"
      />
    </a>
  );
};

export default function DashboardLayout({
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
              background: "linear-gradient(to bottom, #000000 0%, #1a0033 50%, #6b21a8 100%)"
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
                  label: "User Profile",
                  href: "/dashboard/profile",
                  icon: (
                    <IconUserBolt className="h-5 w-5 shrink-0 text-white" />
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        
        <main 
          className="flex-1 overflow-y-auto h-full"
          style={{
            backgroundColor: "#161928"
          }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
