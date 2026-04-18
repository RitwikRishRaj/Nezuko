"use client";

import { memo } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
} from "lucide-react";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messages", label: "Messages", icon: MessageSquare, badge: 2 },
];

interface AdminSidebarProps {
  active: string;
  onActiveChange: (id: string) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  locked: boolean;
  onLockToggle: () => void;
}

const AdminSidebar = memo(function AdminSidebar({
  active,
  onActiveChange,
  expanded,
  onExpandChange,
  locked,
  onLockToggle,
}: AdminSidebarProps) {
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
          alt="Algogym Admin"
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
                  ? "bg-emerald-500/[0.12] text-white"
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
                      ? "text-emerald-400"
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
              ? "text-emerald-400 bg-emerald-500/[0.12] hover:bg-emerald-500/[0.18]"
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

export default AdminSidebar;
