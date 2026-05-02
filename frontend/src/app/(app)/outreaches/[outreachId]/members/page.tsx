"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type OutreachRole = "DIRECTOR" | "STAFF";

interface OutreachMember {
  id: string;
  user_id: string;
  user: { id: string; name: string; email: string };
  role: OutreachRole;
  team_id: string | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

const ROLE_LABEL: Record<OutreachRole, string> = {
  DIRECTOR: "디렉터",
  STAFF: "사역자",
};

const ROLE_COLOR: Record<OutreachRole, string> = {
  DIRECTOR: "bg-coral/15 text-coral",
  STAFF: "bg-ocean/15 text-ocean",
};

export default function OutreachMembersPage() {
  const { outreachId } = useParams<{ outreachId: string }>();

  const [members, setMembers] = useState<OutreachMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 추가 폼
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [addRole, setAddRole] = useState<OutreachRole>("DIRECTOR");
  const [addTeamId, setAddTeamId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, outreachRes] = await Promise.all([
        fetch(`/api/outreaches/${outreachId}/members`),
        fetch(`/api/outreaches/${outreachId}`),
      ]);
      const membersData = await membersRes.json();
      const outreachData = await outreachRes.json();

      if (membersRes.ok) setMembers(membersData.data ?? []);
      if (outreachRes.ok) setTeams(outreachData.data?.teams ?? []);
    } catch {
      setError("데이터를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [outreachId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    setSelectedUser(null);
    setHighlightedIdx(-1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 1) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.data ?? []);
    }, 300);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault();
      const u = searchResults[highlightedIdx];
      setSelectedUser({ id: u.id, name: u.name });
      setSearchResults([]);
      setSearchQuery("");
      setHighlightedIdx(-1);
    } else if (e.key === "Escape") {
      setSearchResults([]);
      setHighlightedIdx(-1);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!selectedUser) return setAddError("멤버를 검색해서 선택해주세요.");
    if (addRole === "STAFF" && !addTeamId) return setAddError("사역자는 담당 팀을 선택해야 합니다.");

    setAddLoading(true);
    try {
      const res = await fetch(`/api/outreaches/${outreachId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: addRole,
          team_id: addRole === "STAFF" ? addTeamId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "추가 실패");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setAddTeamId("");
      await fetchData();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(membershipId: string) {
    setConfirmRemoveId(null);
    const res = await fetch(`/api/outreaches/${outreachId}/members/${membershipId}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) {
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
    }
  }

  const getTeamName = (teamId: string | null) =>
    teams.find((t) => t.id === teamId)?.name ?? "—";

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="text-body-sm text-ink-mute hover:text-ink">
          ← 대시보드
        </Link>
      </div>

      <h1 className="font-display text-h1 mb-1">
        아웃리치 권한 관리<span className="text-coral">.</span>
      </h1>
      <p className="text-body text-ink-soft mb-8">
        디렉터와 사역자를 지정해 아웃리치 운영 권한을 부여하세요.
      </p>

      {/* 권한 설명 */}
      <div className="mb-8 grid grid-cols-2 gap-3 text-body-sm">
        <div className="rounded-md border border-ink/10 p-4">
          <p className="font-medium text-coral mb-1">디렉터</p>
          <p className="text-ink-mute">아웃리치 전체 관리. 모든 팀 조회·승인·정산 가능.</p>
        </div>
        <div className="rounded-md border border-ink/10 p-4">
          <p className="font-medium text-ocean mb-1">사역자</p>
          <p className="text-ink-mute">담당 팀만 관리. 지출 승인·일정·준비물 편집 가능.</p>
        </div>
      </div>

      {/* 현재 멤버 */}
      <section className="mb-8">
        <h2 className="text-h3 font-medium mb-4">현재 권한 목록</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-md bg-paper-deep animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-body text-ink-mute py-6 text-center border border-ink/10 rounded-md">
            아직 지정된 디렉터·사역자가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-md border border-ink/10">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-caption font-medium ${ROLE_COLOR[m.role]}`}
                  >
                    {ROLE_LABEL[m.role]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-medium text-ink truncate">{m.user.name}</p>
                    {m.user.email.includes("@noemail.local") ? (
                      <p className="text-caption text-ink-mute">카카오 로그인</p>
                    ) : (
                      <p className="text-caption text-ink-mute truncate">{m.user.email}</p>
                    )}
                  </div>
                  {m.role === "STAFF" && m.team_id && (
                    <span className="shrink-0 text-body-sm text-ink-mute">
                      ({getTeamName(m.team_id)})
                    </span>
                  )}
                </div>
                {confirmRemoveId === m.id ? (
                  <div className="flex shrink-0 items-center gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-1">
                    <span className="text-caption text-rust">제거할까요?</span>
                    <button onClick={() => handleRemove(m.id)}
                      className="text-caption font-medium text-rust hover:underline">제거</button>
                    <button onClick={() => setConfirmRemoveId(null)}
                      className="text-caption text-ink-mute hover:text-ink">취소</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveId(m.id)}
                    className="shrink-0 text-caption text-ink-mute hover:text-rust transition-colors"
                  >
                    제거
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 추가 폼 */}
      <section>
        <h2 className="text-h3 font-medium mb-4">권한 추가</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          {/* 유저 검색 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">
              멤버 검색 <span className="text-coral">*</span>
            </label>
            <div className="relative" ref={searchContainerRef}>
              {selectedUser ? (
                <div className="flex items-center gap-2 rounded-md border border-ink/30 bg-paper px-4 py-2.5">
                  <span className="flex-1 text-body text-ink font-medium">{selectedUser.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                    className="text-caption text-ink-mute hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
                    placeholder="이름 또는 이메일로 검색"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full rounded-md border border-ink/20 bg-paper shadow-md">
                      {searchResults.map((u, idx) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser({ id: u.id, name: u.name });
                              setSearchResults([]);
                              setSearchQuery("");
                              setHighlightedIdx(-1);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${idx === highlightedIdx ? "bg-ink/8" : "hover:bg-ink/5"}`}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-caption font-medium text-paper flex-shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-body-sm font-medium text-ink">{u.name}</p>
                              <p className="text-caption text-ink-mute">
                                {u.email.includes("@noemail.local") ? "카카오 로그인" : u.email}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">역할</label>
            <div className="flex gap-3">
              {(["DIRECTOR", "STAFF"] as OutreachRole[]).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={addRole === r}
                    onChange={() => { setAddRole(r); setAddTeamId(""); }}
                    className="accent-ink"
                  />
                  <span className="text-body">{ROLE_LABEL[r]}</span>
                </label>
              ))}
            </div>
          </div>

          {addRole === "STAFF" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-medium text-ink-soft">
                담당 팀 <span className="text-coral">*</span>
              </label>
              <select
                value={addTeamId}
                onChange={(e) => setAddTeamId(e.target.value)}
                className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink focus:border-ink focus:outline-none"
              >
                <option value="">— 팀을 선택하세요 —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {addError && (
            <p className="text-body-sm text-rust">{addError}</p>
          )}

          <button
            type="submit"
            disabled={addLoading || !selectedUser}
            className="self-start h-10 rounded-md bg-ink px-6 text-body font-medium text-paper hover:opacity-80 disabled:opacity-50"
          >
            {addLoading ? "추가 중…" : "권한 추가"}
          </button>
        </form>
      </section>

      {error && (
        <div className="mt-6 rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-body-sm text-rust">
          {error}
        </div>
      )}
    </div>
  );
}
