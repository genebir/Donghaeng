"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

// ── 아이콘 ──────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="10" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="10" width="5.5" height="5.5" rx="1" />
      <rect x="10" y="10" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6.5" cy="5" r="2.5" />
      <path d="M1 14c0-3.036 2.462-5.5 5.5-5.5" />
      <circle cx="13" cy="6" r="2" />
      <path d="M10.5 14c0-2.485 1.12-4.5 2.5-4.5s2.5 2.015 2.5 4.5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1.5" y="3" width="14" height="12.5" rx="1.5" />
      <path d="M5 1.5v3M12 1.5v3M1.5 7h14" />
    </svg>
  );
}

function IconChecklist() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4.5h9M6 8.5h9M6 12.5h9" />
      <path d="M2 4.5l1 1L4.5 4M2 8.5l1 1L4.5 8M2 12.5l1 1L4.5 12" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 2h11v13l-2-1.5L10 15l-1.5-1.5L7 15 5.5 13.5 3.5 15z" />
      <path d="M6 6h5M6 9h5M6 12h3" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1.5" y="4.5" width="14" height="10" rx="1.5" />
      <path d="M11.5 9.5a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="currentColor" stroke="none" />
      <path d="M4.5 4.5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8.5" cy="8.5" r="2.25" />
      <path d="M8.5 1.5v1.75M8.5 13.75v1.75M1.5 8.5h1.75M13.75 8.5h1.75M3.49 3.49l1.24 1.24M12.27 12.27l1.24 1.24M13.51 3.49l-1.24 1.24M4.73 12.27l-1.24 1.24" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 7H3M6 4L3 7l3 3" />
    </svg>
  );
}

// ── 공통 NavLink ──────────────────────────────────────────────────────────

function NavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
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

// ── 대시보드 사이드바 ────────────────────────────────────────────────────

const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <IconGrid />, exact: true },
];

function DashboardSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-ink/10 bg-paper md:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {DASHBOARD_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>
      <div className="border-t border-ink/10 p-3">
        <NavLink
          item={{ href: "/settings/profile", label: "설정", icon: <IconSettings /> }}
          isActive={pathname === "/settings/profile"}
        />
      </div>
    </aside>
  );
}

// ── 팀 사이드바 ─────────────────────────────────────────────────────────

function buildTeamNav(teamId: string): NavItem[] {
  const base = `/teams/${teamId}`;
  return [
    { href: base,                  label: "팀 홈",  icon: <IconGrid />,      exact: true },
    { href: `${base}/members`,     label: "멤버",   icon: <IconUsers /> },
    { href: `${base}/schedule`,    label: "일정",   icon: <IconCalendar /> },
    { href: `${base}/checklist`,   label: "준비물", icon: <IconChecklist /> },
    { href: `${base}/expenses`,    label: "지출",   icon: <IconReceipt /> },
    { href: `${base}/budget`,      label: "예산",   icon: <IconWallet /> },
  ];
}

function TeamSidebar({ teamId, pathname }: { teamId: string; pathname: string }) {
  const teamNav = buildTeamNav(teamId);
  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-ink/10 bg-paper md:flex">
      {/* 대시보드로 돌아가기 */}
      <div className="border-b border-ink/10 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-ink-mute hover:bg-paper-deep hover:text-ink"
        >
          <IconArrowLeft />
          대시보드
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {teamNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={
              item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href + "/") || pathname === item.href
            }
          />
        ))}
      </nav>
    </aside>
  );
}

// ── 모바일 탭바도 팀 컨텍스트에 맞게 (같은 파일에서 useParams) ──────────
// 실제 MobileTabbar는 별도 파일 — 여기선 사이드바만

// ── 메인 export ────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;

  if (teamId) {
    return <TeamSidebar teamId={teamId} pathname={pathname} />;
  }
  return <DashboardSidebar pathname={pathname} />;
}
