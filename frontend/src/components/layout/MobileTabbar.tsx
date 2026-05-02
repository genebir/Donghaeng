"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState } from "react";
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

function IconCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 7a2 2 0 0 1 2-2h1.5l2-2.5h5L14.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
      <circle cx="11" cy="12" r="3" />
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

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M3 3l14 14M17 3L3 17" />
    </svg>
  );
}

// ── 더보기 드로어 내부 아이템 ───────────────────────────────────────────────

interface DrawerItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DrawerGroup {
  label: string;
  items: DrawerItem[];
}

function buildDrawerGroups(teamId: string): DrawerGroup[] {
  const base = `/teams/${teamId}`;
  return [
    {
      label: "활동",
      items: [
        { href: `${base}/members`,      label: "멤버",     icon: "👥" },
        { href: `${base}/testimonies`,  label: "간증",     icon: "✦" },
        { href: `${base}/home-updates`, label: "본진 소식", icon: "📢" },
      ],
    },
    {
      label: "회계",
      items: [
        { href: `${base}/expenses/review`, label: "지출 검토", icon: "✓" },
        { href: `${base}/budget`,          label: "예산",      icon: "₩" },
        { href: `${base}/reimbursements`,  label: "정산",      icon: "→" },
        { href: `${base}/reports`,         label: "리포트",    icon: "▦" },
      ],
    },
    {
      label: "관리",
      items: [
        { href: `${base}/share-settings`, label: "공유 설정", icon: "⊹" },
        { href: `${base}/settings`,        label: "팀 설정",   icon: "⚙" },
      ],
    },
  ];
}

const DASHBOARD_TABS: Tab[] = [
  { href: "/dashboard", label: "홈", icon: <IconHome />, exact: true },
  { href: "/settings/profile", label: "설정", icon: <IconMore /> },
];

function buildTeamTabs(teamId: string): Tab[] {
  const base = `/teams/${teamId}`;
  return [
    { href: base,               label: "홈",     icon: <IconHome />,     exact: true },
    { href: `${base}/schedule`, label: "일정",   icon: <IconCalendar /> },
    { href: `${base}/checklist`,label: "준비물", icon: <IconChecklist /> },
    { href: `${base}/expenses`, label: "지출",   icon: <IconReceipt /> },
    { href: `${base}/media`,    label: "미디어", icon: <IconCamera /> },
  ];
}

export function MobileTabbar() {
  const pathname = usePathname();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = teamId ? buildTeamTabs(teamId) : DASHBOARD_TABS;
  const drawerGroups = teamId ? buildDrawerGroups(teamId) : [];

  return (
    <>
      {/* 드로어 오버레이 */}
      {drawerOpen && teamId && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-ink/10 bg-paper pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-body-sm font-semibold text-ink">더보기</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-deep text-ink-mute hover:text-ink"
              >
                <IconClose />
              </button>
            </div>

            {/* 드로어 그룹 */}
            <div className="px-4 pb-8 flex flex-col gap-5">
              {drawerGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-1 text-caption font-semibold uppercase tracking-widest text-ink-mute/60">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 text-center transition-colors",
                          pathname === item.href || pathname.startsWith(item.href + "/")
                            ? "bg-ink text-paper"
                            : "bg-paper-deep text-ink-soft hover:bg-ink/10",
                        )}
                      >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span className="text-caption font-medium leading-tight">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 탭바 */}
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

        {/* 더보기 버튼 (팀 컨텍스트에서만) */}
        {teamId && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
              drawerOpen ? "text-ink" : "text-ink-mute",
            )}
          >
            <IconMore />
            <span className="text-caption font-medium">더보기</span>
          </button>
        )}
      </nav>
    </>
  );
}
