"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useTeamRole } from "@/hooks/useTeamRole";

interface Tab {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
  isActiveCheck?: (pathname: string) => boolean;
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

// ── 드로어 전용 아이콘 (20×20) ──────────────────────────────────────────────

function DIconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7.5" cy="6" r="3" />
      <path d="M1 17c0-3.5 2.9-6.5 6.5-6.5" />
      <circle cx="15" cy="7" r="2.5" />
      <path d="M12 17c0-3 1.3-5.5 3-5.5s3 2.5 3 5.5" />
    </svg>
  );
}

function DIconTestimony() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6l-4 4V3z" />
    </svg>
  );
}

function DIconMegaphone() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 7.5h2.5l8.5-5v13l-8.5-5H3.5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
      <path d="M6 7.5v5" />
    </svg>
  );
}

function DIconClipboardCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2.5H15.5A1.5 1.5 0 0 1 17 4v13.5A1.5 1.5 0 0 1 15.5 19h-11A1.5 1.5 0 0 1 3 17.5V4A1.5 1.5 0 0 1 4.5 2.5H7" />
      <rect x="7" y="1.5" width="6" height="3" rx="1" />
      <path d="M7 11l2 2 4-4" />
    </svg>
  );
}

function DIconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5.5" width="16" height="11" rx="1.5" />
      <path d="M13.5 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="currentColor" stroke="none" />
      <path d="M5.5 5.5V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1.5" />
    </svg>
  );
}

function DIconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2L9.5 10.5M18 2l-6 16-2.5-7.5L2 8l16-6z" />
    </svg>
  );
}

function DIconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="11" width="3.5" height="7" rx="0.5" />
      <rect x="8.25" y="6" width="3.5" height="12" rx="0.5" />
      <rect x="14" y="2" width="3.5" height="16" rx="0.5" />
    </svg>
  );
}

function DIconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="15.5" cy="4" r="1.75" />
      <circle cx="15.5" cy="16" r="1.75" />
      <circle cx="4.5" cy="10" r="1.75" />
      <path d="M6.2 9.1l7.6-4M6.2 10.9l7.6 4" />
    </svg>
  );
}

function DIconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4" />
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

function buildDrawerGroups(teamId: string, isAdmin: boolean): DrawerGroup[] {
  const base = `/teams/${teamId}`;
  const groups: DrawerGroup[] = [
    {
      label: "활동",
      items: [
        { href: `${base}/members`,      label: "멤버",     icon: <DIconUsers /> },
        { href: `${base}/testimonies`,  label: "간증",     icon: <DIconTestimony /> },
        { href: `${base}/home-updates`, label: "본진 소식", icon: <DIconMegaphone /> },
      ],
    },
  ];
  if (isAdmin) {
    groups.push(
      {
        label: "회계",
        items: [
          { href: `${base}/expenses/review`, label: "지출 검토", icon: <DIconClipboardCheck /> },
          { href: `${base}/budget`,          label: "예산",      icon: <DIconWallet /> },
          { href: `${base}/reimbursements`,  label: "정산",      icon: <DIconSend /> },
          { href: `${base}/reports`,         label: "리포트",    icon: <DIconBarChart /> },
        ],
      },
      {
        label: "관리",
        items: [
          { href: `${base}/share-settings`, label: "공유 설정", icon: <DIconShare /> },
          { href: `${base}/settings`,        label: "팀 설정",   icon: <DIconSettings /> },
        ],
      }
    );
  }
  return groups;
}

const DASHBOARD_TABS: Tab[] = [
  { href: "/dashboard", label: "홈", icon: <IconHome />, exact: true },
  { href: "/settings/profile", label: "설정", icon: <DIconSettings /> },
];

function buildTeamTabs(teamId: string): Tab[] {
  const base = `/teams/${teamId}`;
  return [
    { href: base,               label: "홈",     icon: <IconHome />,     exact: true },
    { href: `${base}/schedule`, label: "일정",   icon: <IconCalendar /> },
    { href: `${base}/checklist`,label: "준비물", icon: <IconChecklist /> },
    {
      href: `${base}/expenses`,
      label: "지출",
      icon: <IconReceipt />,
      isActiveCheck: (p) =>
        p === `${base}/expenses` ||
        (p.startsWith(`${base}/expenses/`) && !p.startsWith(`${base}/expenses/review`)),
    },
    { href: `${base}/media`,    label: "미디어", icon: <IconCamera /> },
  ];
}

export function MobileTabbar() {
  const pathname = usePathname();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAdmin } = useTeamRole();

  const tabs = teamId ? buildTeamTabs(teamId) : DASHBOARD_TABS;
  const drawerGroups = teamId ? buildDrawerGroups(teamId, isAdmin) : [];

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen]);

  const isInDrawer = drawerGroups
    .flatMap((g) => g.items)
    .some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

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

            {/* 대시보드 바로가기 */}
            <div className="px-4 pb-2">
              <Link
                href="/dashboard"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl bg-paper-deep px-4 py-3 text-body-sm font-medium text-ink-soft hover:bg-ink/10 active:bg-ink/15 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M13 8H3M6 5L3 8l3 3" />
                </svg>
                대시보드로
              </Link>
            </div>

            {/* 드로어 그룹 */}
            <div className="px-4 pb-8 flex flex-col gap-5">
              {drawerGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-1 text-caption font-semibold uppercase tracking-overline text-ink-mute/60">
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
                        <span className="flex items-center justify-center">{item.icon}</span>
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

      {/* 탭바 — bg가 safe area까지 내려가도록 pb-safe 적용, 탭 아이템은 h-16 row에만 배치 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-paper pb-safe md:hidden">
        <div className="flex h-16 items-center">
          {tabs.map((tab) => {
            const isActive = tab.isActiveCheck
              ? tab.isActiveCheck(pathname)
              : tab.exact
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
                drawerOpen || isInDrawer ? "text-ink" : "text-ink-mute",
              )}
            >
              <IconMore />
              <span className="text-caption font-medium">더보기</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
