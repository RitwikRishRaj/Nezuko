"use client";

import { memo } from "react";
import Image from "next/image";
import {
  Swords,
  Bell,
  Mail,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
} from "lucide-react";

const LeaderboardIcon = ({ size, strokeWidth, className }: { size?: number | string, strokeWidth?: number | string, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    strokeWidth={strokeWidth || 1.5} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
  >
    <path d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navItems = [
  { id: "arena", label: "Arena", icon: Swords },
  { id: "leaderboard", label: "Leaderboard", icon: LeaderboardIcon },
  { id: "notifications", label: "Alerts", icon: Bell, badge: 3 },
  { id: "writetous", label: "Write to Us", icon: Mail },
  { id: "settings", label: "Profile", icon: Settings },
];

interface SidebarProps {
  active: string;
  onActiveChange: (id: string) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  locked: boolean;
  onLockToggle: () => void;
}

const Sidebar = memo(function Sidebar({
  active,
  onActiveChange,
  expanded,
  onExpandChange,
  locked,
  onLockToggle,
}: SidebarProps) {
  return (
    <aside
      className={`sidebar-transition fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden ${
        expanded ? "w-[180px]" : "w-[56px]"
      } border-r border-white/[0.04] bg-[#09090b]`}
    >
      {/* Logo */}
      <div className="flex h-12 items-center justify-center border-b border-white/[0.04] flex-shrink-0">
        <Image
          src="/algogym_logo.svg"
          alt="Algogym"
          width={28}
          height={28}
          className="flex-shrink-0"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onActiveChange(item.id)}
              className={`nav-item group relative flex items-center rounded-lg ${
                expanded ? "gap-2.5 px-2 py-[9px]" : "justify-center px-0 py-[9px]"
              } transition-colors duration-200 ${
                isActive
                  ? "bg-violet-500/[0.12] text-white"
                  : "hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {/* Icon */}
              <span className="relative flex-shrink-0">
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-violet-400"
                      : "text-white/60 group-hover:text-white"
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>

              {/* Label — always in DOM, clips via overflow */}
              <span
                className={`nav-label text-[12px] font-medium ${
                  isActive ? "text-white" : "text-white/60 group-hover:text-white"
                } ${expanded ? "nav-label-visible" : "nav-label-hidden"}`}
              >
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {!expanded && (
                <div className="nav-tooltip absolute left-full ml-2.5 rounded-md bg-[#1a1a1f] px-2.5 py-1 text-[11px] font-medium text-white shadow-xl border border-white/[0.06] z-[100]">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-[3px] border-transparent border-r-[#1a1a1f]" />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="flex-shrink-0 border-t border-white/[0.04] p-1.5 flex flex-col gap-0.5">
        {/* Lock / Unlock */}
        <button
          onClick={onLockToggle}
          title={locked ? "Unlock auto-expand" : "Lock sidebar (disable auto-expand)"}
          className={`flex w-full items-center justify-center rounded-lg py-2 transition-all duration-200 ${
            locked
              ? "text-violet-400 bg-violet-500/[0.12] hover:bg-violet-500/[0.18]"
              : "text-white/70 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {locked ? <Lock size={14} strokeWidth={2} /> : <Unlock size={14} strokeWidth={1.5} />}
        </button>

        {/* Expand / Collapse */}
        <button
          onClick={() => onExpandChange(!expanded)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-white/60 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
        >
          {expanded ? (
            <ChevronsLeft size={15} strokeWidth={1.5} />
          ) : (
            <ChevronsRight size={15} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
