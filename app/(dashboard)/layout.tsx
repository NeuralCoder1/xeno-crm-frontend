"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth";
import { cn } from "@/src/lib/utils";
import {
  LayoutDashboard, Users, Layers, Megaphone, ScrollText, BrainCircuit,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/segments", label: "Segments", icon: Layers },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/logs", label: "Comm Logs", icon: ScrollText },
  { href: "/ai", label: "AI Copilot", icon: BrainCircuit },
];

export default function DashboardGroup({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  // Close mobile nav on route change without calling setState in effect body
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  if (!isAuthenticated) return null;

  const pageLabel = nav.find((n) => pathname.startsWith(n.href))?.label ?? "Xeno CRM";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 flex-col bg-sidebar border-r border-border" aria-label="Main navigation">
        <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">X</div>
          <span className="text-sm font-semibold text-foreground">Xeno CRM</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-sidebar-foreground hover:bg-secondary hover:text-foreground")}
                aria-current={active ? "page" : undefined}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button onClick={() => { logout(); router.push("/login"); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Sign out"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-border transform transition-transform md:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")} aria-label="Mobile navigation">
        <div className="flex h-14 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">X</div>
            <span className="text-sm font-semibold text-foreground">Xeno CRM</span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-sidebar-foreground hover:bg-secondary hover:text-foreground")}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button onClick={() => { logout(); router.push("/login"); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Sign out"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Xeno CRM</span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{pageLabel}</span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary" aria-label="User avatar">D</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
