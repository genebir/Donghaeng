"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/cn";

interface Tab {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M8 20v-8h6v8" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="18" height="16" rx="2" />
      <path d="M7 2v4M15 2v4M2 9h18" />
    </svg>
  );
}

function IconChecklist() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M3 6l1 1L5.5 5M3 12l1 1L5.5 11M3 18l1 1L5.5 17" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 3h14v17l-2.5-2L13 20l-2-2-2 2-2.5-2L4 20z" />
      <path d="M8 8h6M8 12h6M8 16h4" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="5.5" cy="11" r="1" fill="currentColor" />
      <circle cx="11" cy="11" r="1" fill="currentColor" />
      <circle cx="16.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

const DASHBOARD_TABS: Tab[] = [
  { href: "/dashboard", label: "홈", icon: <IconHome />, exact: true },
  { href: "/settings/profile", label: "설정", icon: <IconMore /> },
];

function buildTeamTabs(teamId: string): Tab[] {
  const base = `/teams/${teamId}`;
  return [
    { href: base,               label: "홈",     icon: <IconHome />, exact: true },
    { href: `${base}/schedule`, label: "일정",   icon: <IconCalendar /> },
    { href: `${base}/checklist`,label: "준비물", icon: <IconChecklist /> },
    { href: `${base}/expenses`, label: "지출",   icon: <IconReceipt /> },
    { href: `${base}/members`,  label: "더보기", icon: <IconMore /> },
  ];
}

export function MobileTabbar() {
  const pathname = usePathname();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;

  const tabs = teamId ? buildTeamTabs(teamId) : DASHBOARD_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-ink/10 bg-paper pb-safe md:hidden">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
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
