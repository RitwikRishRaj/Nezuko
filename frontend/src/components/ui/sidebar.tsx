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
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center group/sidebar py-3 min-w-0 flex-nowrap relative overflow-hidden",
        className
      )}
      {...props}
    >
      <motion.div 
        className="flex items-center w-full"
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
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center min-w-[20px] min-h-[20px] relative z-10">
          <div className="w-5 h-5 flex items-center justify-center">
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
              className="text-white dark:text-neutral-200 text-base group-hover/sidebar:translate-x-1 whitespace-nowrap flex-shrink-0 overflow-hidden"
            >
              {link.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </a>
  );
};
