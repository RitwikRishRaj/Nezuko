//homepage
"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Footer } from '@/components/footer-section';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MagicBento from "@/components/MagicBento";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

export default function LandingPage() {
  const router = useRouter();
  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const { signOut } = clerk;
  const { setVerified, setChecking } = useUserStore();

  // Check Supabase verified status once the user is loaded
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    setChecking(true);
    (async () => {
      try {
        await fetch('/api/sync-user', { method: 'POST' });
        
        const { data } = await supabase
          .from("users")
          .select("is_verified")
          .eq("clerk_id", user.id)
          .maybeSingle();

        const verified = !!data?.is_verified;
        setVerified(verified);
        
        // Auto-redirect unverified users to verify page
        if (!verified) {
          router.push('/verify');
        }
      } catch {
        setVerified(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [isLoaded, isSignedIn, user, setVerified, setChecking, router]);

  const handleMobileLogin = async () => {
    setIsMobileMenuOpen(false);
    if (isSignedIn) {
      try {
        await signOut(() => {
          window.location.assign("/");
        });
      } catch (error) {
        console.error("Failed to sign out", error);
      }
    } else {
      if (!clerk.loaded) return;
      try {
        await clerk.openSignIn({
          forceRedirectUrl: '/',
          fallbackRedirectUrl: '/'
        });
      } catch (error) {
        console.error("Failed to open Clerk sign-in", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <div className="relative">
              <InteractiveHoverButton />
            </div>
           
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-white hover:text-gray-300"
              >
                <span className="block py-2">{item.name}</span>
              </a>
            ))}
            <div className="mt-4 flex w-full flex-col gap-4">
              <NavbarButton
                onClick={handleMobileLogin}
                variant="primary"
                className="w-full"
                as="button"
              >
                {isSignedIn ? 'Sign Out' : 'Login'}
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                className="w-full"
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <h1 className="mb-12 text-center text-5xl font-bold md:text-6xl">
            Welcome to Our Platform
          </h1>
          <div className="w-full max-w-4xl px-4">
            <MagicBento 
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="132, 0, 255"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
