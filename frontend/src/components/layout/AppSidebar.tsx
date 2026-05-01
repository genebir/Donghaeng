"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="10" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="10" width="6" height="6" rx="1" />
      <rect x="10" y="10" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.575 3.575l1.415 1.415M13.01 13.01l1.415 1.415M14.425 3.575l-1.415 1.415M4.99 13.01l-1.415 1.415" />
    </svg>
  );
}

const TOP_NAV: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <IconDashboard /> },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/settings/profile", label: "설정", icon: <IconSettings /> },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium transition-colors",
        isActive
          ? "bg-ink text-paper"
          : "text-ink-soft hover:bg-paper-deep hover:text-ink",
      )}
    >
      <span className={cn("flex-shrink-0", isActive ? "text-paper" : "text-ink-mute")}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-ink/10 bg-paper md:flex md:flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {TOP_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      <div className="border-t border-ink/10 p-3">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </aside>
  );
}
