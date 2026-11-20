"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transfers", label: "Transfers" },
  { href: "/analytics", label: "Analytics" },
  { href: "/budgets", label: "Budgets" },
  { href: "/bills", label: "Bills" },
  { href: "/goals", label: "Goals" },
  { href: "/recurring", label: "Recurring" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-border/50">
          <div className="flex h-14 items-center gap-3 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-xs shadow-md">
              F
            </div>
            <span className="text-lg font-bold tracking-tight">FinanceFlow</span>
          </div>
          <nav className="space-y-0.5 px-3 py-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border/50 p-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-1.5">
              <ThemeToggle />
              <span className="text-xs text-muted-foreground">Theme</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-xs">
          F
        </div>
        <span className="font-bold tracking-tight">FinanceFlow</span>
      </div>
      <ThemeToggle />
    </div>
  );
}
