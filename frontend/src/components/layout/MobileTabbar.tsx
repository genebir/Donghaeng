"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  {
    href: "/dashboard",
    label: "홈",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M8 20v-8h6v8" />
      </svg>
    ),
  },
  {
    href: "/settings/profile",
    label: "설정",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="3" />
        <path d="M11 2v2.5M11 17.5V20M2 11h2.5M17.5 11H20M4.22 4.22l1.77 1.77M16.01 16.01l1.77 1.77M19.78 4.22l-1.77 1.77M5.99 16.01l-1.77 1.77" />
      </svg>
    ),
  },
];

export function MobileTabbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-ink/10 bg-paper pb-safe md:hidden">
      {TABS.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2",
              isActive ? "text-ink" : "text-ink-mute",
            )}
          >
            {tab.icon}
            <span className="text-caption font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
