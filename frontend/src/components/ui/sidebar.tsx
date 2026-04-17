"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-screen px-5 py-5 flex flex-col shrink-0 relative z-10 rounded-r-xl overflow-hidden",
          className
        )}
        animate={{
          width: animate ? (open ? 240 : 80) : 240,
        }}
        transition={{
          type: "tween",
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
          when: "beforeChildren"
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    setIsActive(window.location.pathname === link.href);
  }, [link.href]);

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center group/sidebar py-3 px-3 min-w-0 flex-nowrap relative overflow-hidden rounded-lg transition-all duration-300 no-underline",
        isActive 
          ? "bg-white/10 shadow-lg shadow-purple-500/20" 
          : "hover:bg-white/5",
        className
      )}
      style={{ textDecoration: 'none' }}
      {...props}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        />
      )}

      <motion.div 
        className="flex items-center w-full relative z-10"
        initial={false}
        animate={{
          justifyContent: animate ? (open ? "flex-start" : "center") : "flex-start",
        }}
        transition={{
          type: "tween",
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
          staggerChildren: 0.05
        }}
      >
        <div className={cn(
          "flex-shrink-0 w-5 h-5 flex items-center justify-center min-w-[20px] min-h-[20px] relative z-10 transition-all duration-300",
          isActive && "scale-110"
        )}>
          <div className={cn(
            "w-5 h-5 flex items-center justify-center transition-all duration-300",
            isActive && "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
          )}>
            {link.icon}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(open || !animate) && (
            <motion.span
              initial={animate ? { 
                opacity: 0,
                x: -10,
                width: 0
              } : undefined}
              animate={animate ? { 
                opacity: open ? 1 : 0,
                x: open ? 0 : -10,
                width: open ? 'auto' : 0,
                marginLeft: open ? '0.75rem' : 0,
                transitionEnd: {
                  display: open ? 'block' : 'none'
                }
              } : {}}
              transition={{
                type: "tween",
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
                opacity: { 
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                },
                x: { 
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                },
                width: { 
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                },
                marginLeft: { 
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              className={cn(
                "text-base group-hover/sidebar:translate-x-1 whitespace-nowrap flex-shrink-0 overflow-hidden transition-all duration-300",
                isActive 
                  ? "text-white font-semibold drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                  : "text-white/80 dark:text-neutral-200"
              )}
            >
              {link.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </a>
  );
};
