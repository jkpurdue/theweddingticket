"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = pathname?.startsWith("/dashboard");
  const isInvite = pathname?.startsWith("/invite");
  const isLanding = pathname === "/";

  if (isInvite) {
    // Clean minimal nav for public invite
    return (
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-5xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-serif text-2xl tracking-[-0.5px] text-foreground">
            <img 
              src="/the-wedding-ticket-logo.png" 
              alt="The Wedding Ticket" 
              className="h-10 object-contain" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition tracking-[0.5px]">
            Start Planning Free
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img 
            src="/the-wedding-ticket-logo.png" 
            alt="The Wedding Ticket" 
            className="h-10 sm:h-12 object-contain" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="hidden sm:block text-[10px] font-mono tracking-[3.5px] text-muted-foreground/50 mt-1">EST. 2026</div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {!isDashboard && (
            <>
              <Link href="#how" className="text-muted-foreground hover:text-foreground transition">How it Works</Link>
              <Link href="#stories" className="text-muted-foreground hover:text-foreground transition">Stories</Link>
            </>
          )}
          {isDashboard && user && (
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">Our Wedding</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              {!isDashboard && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Our Wedding</Link>
                </Button>
              )}
              <Button variant="outline" onClick={signOut} size="sm">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="elegant" size="sm" asChild>
                <Link href="/dashboard">Start Planning Free</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-6 py-6 flex flex-col gap-4 text-sm">
          {!isDashboard && (
            <>
              <Link href="#how" className="py-1" onClick={() => setMobileOpen(false)}>How it Works</Link>
              <Link href="#stories" className="py-1" onClick={() => setMobileOpen(false)}>Stories</Link>
            </>
          )}
          <div className="h-px bg-border my-2" />
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Our Wedding</Link>
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-left py-1 text-destructive">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-primary font-medium">Start Planning Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
