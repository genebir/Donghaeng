"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

type TeamRole = "LEADER" | "MEMBER";
type TeamPart = "MEDIA" | "WORSHIP" | "TEACHER" | "FINANCE" | "MEDICAL" | "GENERAL";

interface EmergencyInfo {
  phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

interface Member {
  id: string;
  team_id: string;
  user: { id: string; name: string; email: string; profile_image_url: string | null };
  role: TeamRole;
  part: TeamPart | null;
  is_part_lead: boolean;
  joined_at: string;
  emergency_info: EmergencyInfo | null;
}

const PART_LABEL: Record<TeamPart, string> = {
  MEDIA: "미디어", WORSHIP: "찬양", TEACHER: "교사",
  FINANCE: "회계", MEDICAL: "의료", GENERAL: "일반",
};
const PARTS = Object.keys(PART_LABEL) as TeamPart[];

const ROLE_STYLE: Record<TeamRole, string> = {
  LEADER: "bg-coral/10 text-coral",
  MEMBER: "bg-ink-mute/10 text-ink-mute",
};

const EMERGENCY_FIELDS: { key: keyof EmergencyInfo; label: string; placeholder: string }[] = [
  { key: "phone",                      label: "본인 전화번호",      placeholder: "010-0000-0000" },
  { key: "blood_type",                 label: "혈액형",             placeholder: "A+, B-, O+, AB+" },
  { key: "allergies",                  label: "알레르기",            placeholder: "없으면 비워두세요" },
  { key: "medical_conditions",         label: "지병 / 복용약",       placeholder: "없으면 비워두세요" },
  { key: "emergency_contact_name",     label: "비상연락인 이름",     placeholder: "어머니, 아버지…" },
  { key: "emergency_contact_phone",    label: "비상연락인 전화번호", placeholder: "010-0000-0000" },
  { key: "emergency_contact_relation", label: "비상연락인 관계",     placeholder: "어머니, 배우자…" },
];

function EmergencyModal({
  member,
  canEdit,
  currentUserId,
  onClose,
  onSaved,
}: {
  member: Member;
  canEdit: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onSaved: (id: string, info: EmergencyInfo) => void;
}) {
  const info = member.emergency_info ?? {};
  const [form, setForm] = useState<EmergencyInfo>(
    Object.fromEntries(
      EMERGENCY_FIELDS.map(({ key }) => [key, info[key] ?? ""])
    ) as EmergencyInfo
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEditThis = canEdit || currentUserId === member.user.id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const cleaned = Object.fromEntries(
      Object.entries(form).filter(([, v]) => String(v ?? "").trim() !== "")
    ) as EmergencyInfo;
    try {
      const res = await fetch(`/api/team-members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency_info: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "저장에 실패했어요.");
      onSaved(member.id, cleaned);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  const hasInfo = EMERGENCY_FIELDS.some(({ key }) => info[key]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-ink/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-ink/10 bg-paper shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="text-body-sm font-medium text-ink">{member.user.name}</p>
            <p className="text-caption text-ink-mute">응급 정보</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-mute hover:bg-paper-deep">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          {canEditThis ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {EMERGENCY_FIELDS.map(({ key, label, placeholder }) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-caption font-semibold uppercase tracking-overline text-ink-mute">{label}</span>
                  <input
                    value={form[key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
                  />
                </label>
              ))}
              {error && <p className="text-body-sm text-rust">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 h-9 rounded-md border border-ink/20 text-body-sm text-ink hover:bg-paper-deep">
                  취소
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-9 rounded-md bg-ink text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-50">
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-3">
              {hasInfo ? (
                EMERGENCY_FIELDS.map(({ key, label }) => {
                  const val = info[key];
                  if (!val) return null;
                  return (
                    <div key={key}>
                      <dt className="text-caption uppercase tracking-overline font-semibold text-ink-mute">{label}</dt>
                      <dd className="mt-0.5 text-body-sm text-ink">{val}</dd>
                    </div>
                  );
                })
              ) : (
                <p className="text-body-sm text-ink-mute">응급 정보가 없습니다.</p>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadEmergencyCSV(members: Member[]) {
  const headers = ["이름", "이메일", "파트", "전화번호", "혈액형", "알레르기", "지병/복용약", "비상연락인", "비상연락 전화", "관계"];
  const rows = members.map((m) => {
    const info = m.emergency_info ?? {};
    return [
      m.user.name,
      m.user.email.includes("@noemail.local") ? "" : m.user.email,
      m.part ? PART_LABEL[m.part] : "",
      info.phone ?? "",
      info.blood_type ?? "",
      info.allergies ?? "",
      info.medical_conditions ?? "",
      info.emergency_contact_name ?? "",
      info.emergency_contact_phone ?? "",
      info.emergency_contact_relation ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  });
  const csv = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "비상연락망.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />;
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink text-body-sm font-medium text-paper">
      {name.charAt(0)}
    </div>
  );
}

function MemberRow({
  member,
  isAdmin,
  onUpdate,
  onRemove,
  onEmergency,
}: {
  member: Member;
  isAdmin: boolean;
  onUpdate: (id: string, patch: Partial<{ role: TeamRole; part: TeamPart | null; is_part_lead: boolean }>) => Promise<boolean>;
  onRemove: (id: string) => void;
  onEmergency: (member: Member) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [role, setRole] = useState<TeamRole>(member.role);
  const [part, setPart] = useState<TeamPart | "">(member.part ?? "");
  const [isPartLead, setIsPartLead] = useState(member.is_part_lead);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setEditing(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing]);

  async function save() {
    setSaving(true);
    const ok = await onUpdate(member.id, {
      role,
      part: part || null,
      is_part_lead: isPartLead,
    });
    setSaving(false);
    if (ok) setEditing(false);
  }

  return (
    <li className="rounded-md border border-ink/10 bg-paper p-4">
      <div className="flex items-center gap-4">
        <Avatar name={member.user.name} imageUrl={member.user.profile_image_url} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{member.user.name}</span>
            {member.is_part_lead && (
              <span className="rounded bg-ocean/10 px-1.5 py-0.5 text-caption font-medium text-ocean">파트장</span>
            )}
          </div>
          {member.emergency_info?.phone ? (
            <a
              href={`tel:${member.emergency_info.phone.replace(/\s/g, "")}`}
              className="truncate text-body-sm text-ocean hover:underline"
            >
              {member.emergency_info.phone}
            </a>
          ) : (
            <span className="truncate text-body-sm text-ink-mute">
              {member.user.email.includes("@noemail.local") ? "카카오 로그인" : member.user.email}
            </span>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className={cn("rounded px-2 py-0.5 text-caption font-medium", ROLE_STYLE[member.role])}>
            {member.role === "LEADER" ? "팀장" : "팀원"}
          </span>
          {member.part && <span className="text-caption text-ink-mute">{PART_LABEL[member.part]}</span>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 ml-2">
          {/* 응급 정보 버튼 — 항상 표시 (본인 or 관리자) */}
          <button
            onClick={() => onEmergency(member)}
            title="응급 정보"
            className={`rounded px-2 py-1 text-caption transition-colors ${
              member.emergency_info && Object.values(member.emergency_info).some(Boolean)
                ? "text-rust hover:bg-rust/10"
                : "text-ink-mute hover:bg-paper-deep hover:text-ink"
            }`}
          >
            응급
          </button>
          {isAdmin && (
            <>
              <button onClick={() => { setEditing((v) => !v); setConfirmRemove(false); }}
                className="text-body-sm text-ink-mute hover:text-ink">
                {editing ? "닫기" : "편집"}
              </button>
              {confirmRemove ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-body-sm text-rust">정말요?</span>
                  <button onClick={() => onRemove(member.id)}
                    className="text-body-sm font-semibold text-rust hover:underline">제거</button>
                  <button onClick={() => setConfirmRemove(false)}
                    className="text-body-sm text-ink-mute hover:text-ink">취소</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemove(true)}
                  className="text-body-sm text-ink-mute hover:text-rust transition-colors">
                  제거
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 border-t border-ink/10 pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-caption text-ink-mute">역할</span>
            <div className="flex gap-2">
              {(["MEMBER", "LEADER"] as TeamRole[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg py-2 text-body-sm font-medium transition-colors ${role === r ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                  {r === "MEMBER" ? "팀원" : "팀장"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-caption text-ink-mute">파트</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button type="button" onClick={() => setPart("")}
                className={`rounded-lg py-2 text-caption font-medium transition-colors ${part === "" ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                없음
              </button>
              {PARTS.map((p) => (
                <button key={p} type="button" onClick={() => setPart(p)}
                  className={`rounded-lg py-2 text-caption font-medium transition-colors ${part === p ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                  {PART_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-body-sm cursor-pointer">
              <input type="checkbox" checked={isPartLead} onChange={(e) => setIsPartLead(e.target.checked)} className="accent-ink" />
              파트장
            </label>
            <button onClick={save} disabled={saving}
              className="h-8 rounded-md bg-ink px-5 text-body-sm font-medium text-paper disabled:opacity-50">
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function MembersPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [emergencyMember, setEmergencyMember] = useState<Member | null>(null);
  const autoOpenedRef = useRef(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 추가 폼
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [addRole, setAddRole] = useState<TeamRole>("MEMBER");
  const [addPart, setAddPart] = useState<TeamPart | "">("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
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

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMembers(data.data ?? []);

      // 내 프로필로 admin 여부 확인
      const me = await fetch("/api/users/me").then((r) => r.json()).catch(() => ({}));
      const myData = me?.data;
      const orgRole = myData?.org_role;
      const isOrgAdmin = orgRole === "OWNER" || orgRole === "ADMIN";
      const isDirector = (myData?.outreach_memberships ?? []).some(
        (om: { role: string }) => om.role === "DIRECTOR"
      );
      const isStaff = (myData?.outreach_memberships ?? []).some(
        (om: { role: string; team_id: string | null }) =>
          om.role === "STAFF" && om.team_id === teamId
      );
      const isLeader = (data.data ?? []).some(
        (m: Member) => m.user.id === myData?.id && m.role === "LEADER"
      );
      setIsAdmin(isOrgAdmin || isDirector || isStaff || isLeader);
      const myId = myData?.id ?? null;
      setCurrentUserId(myId);

      // ?openEmergency=1 로 진입하면 내 응급 정보 모달 자동 열기
      if (myId && !autoOpenedRef.current && searchParams.get("openEmergency") === "1") {
        autoOpenedRef.current = true;
        const myMember = (data.data ?? []).find((m: Member) => m.user.id === myId);
        if (myMember) setEmergencyMember(myMember);
      }
    } catch {
      setError("멤버 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [teamId, searchParams]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleUpdate(
    memberId: string,
    patch: Partial<{ role: TeamRole; part: TeamPart | null; is_part_lead: boolean }>,
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/team-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "수정에 실패했어요.", false);
        return false;
      }
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...data.data } : m)));
      showToast("수정됐어요.", true);
      return true;
    } catch {
      showToast("잠깐 문제가 있었어요.", false);
      return false;
    }
  }

  async function handleRemove(memberId: string) {
    const backup = members;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    try {
      const res = await fetch(`/api/team-members/${memberId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setMembers(backup);
        showToast("제거에 실패했어요.", false);
      } else {
        showToast("멤버를 제거했어요.", true);
      }
    } catch {
      setMembers(backup);
      showToast("잠깐 문제가 있었어요.", false);
    }
  }

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

    setAddLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: addRole,
          part: addPart || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "추가 실패");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setAddRole("MEMBER");
      setAddPart("");
      await fetchMembers();
      showToast("멤버를 추가했어요.", true);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setAddLoading(false);
    }
  }

  // 파트별 그룹핑
  const leaders = members.filter((m) => m.role === "LEADER");
  const byPart: Record<string, Member[]> = {};
  for (const m of members.filter((m) => m.role !== "LEADER")) {
    const k = m.part ?? "GENERAL";
    if (!byPart[k]) byPart[k] = [];
    byPart[k].push(m);
  }
  const groups: { label: string; items: Member[] }[] = [];
  if (leaders.length) groups.push({ label: "팀장", items: leaders });
  for (const [part, items] of Object.entries(byPart)) {
    groups.push({ label: PART_LABEL[part as TeamPart] ?? part, items });
  }

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}
      {emergencyMember && (
        <EmergencyModal
          member={emergencyMember}
          canEdit={isAdmin}
          currentUserId={currentUserId}
          onClose={() => setEmergencyMember(null)}
          onSaved={(id, info) => {
            setMembers((prev) => prev.map((m) => m.id === id ? { ...m, emergency_info: info } : m));
            showToast("응급 정보가 저장됐어요.", true);
          }}
        />
      )}

      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">
            멤버<span className="text-coral">.</span>
            <span className="ml-2 text-h2 font-normal text-ink-mute">{members.length}명</span>
          </h1>
        </div>
        {isAdmin && members.length > 0 && (
          <button
            onClick={() => downloadEmergencyCSV(members)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink/15 px-3 text-body-sm text-ink-mute hover:border-ink/30 hover:text-ink transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6.5 1v8M3.5 6.5l3 3 3-3" />
              <path d="M1 10.5h11" />
            </svg>
            비상연락망
          </button>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-body-sm text-rust">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-md bg-paper-deep animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.length === 0 ? (
            <p className="text-body text-ink-mute">아직 팀원이 없습니다.</p>
          ) : (
            groups.map(({ label, items }) => (
              <section key={label}>
                <h2 className="mb-3 text-body-sm font-medium uppercase tracking-wide text-ink-mute">
                  {label} · {items.length}명
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      isAdmin={isAdmin}
                      onUpdate={handleUpdate}
                      onRemove={handleRemove}
                      onEmergency={setEmergencyMember}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      {/* 멤버 추가 (관리자만) */}
      {isAdmin && (
        <section className="mt-10 border-t border-ink/10 pt-8">
          <h2 className="mb-4 text-h3 font-medium">멤버 추가</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {/* 유저 검색 */}
            <div className="relative" ref={searchContainerRef}>
              {selectedUser ? (
                <div className="flex items-center gap-2 rounded-md border border-ink/30 bg-paper px-4 py-2.5">
                  <span className="flex-1 text-body text-ink font-medium">{selectedUser.name}</span>
                  <button type="button" onClick={() => { setSelectedUser(null); setSearchQuery(""); }} className="text-caption text-ink-mute hover:text-ink">✕</button>
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
                            onClick={() => { setSelectedUser({ id: u.id, name: u.name }); setSearchResults([]); setSearchQuery(""); setHighlightedIdx(-1); }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === highlightedIdx ? "bg-ink/8" : "hover:bg-ink/5"}`}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-caption font-medium text-paper flex-shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-body-sm font-medium text-ink">{u.name}</p>
                              <p className="text-caption text-ink-mute">{u.email.includes("@noemail.local") ? "카카오 로그인" : u.email}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-caption text-ink-mute">역할</span>
                <div className="flex gap-2">
                  {(["MEMBER", "LEADER"] as TeamRole[]).map((r) => (
                    <button key={r} type="button" onClick={() => setAddRole(r)}
                      className={`flex-1 rounded-lg py-2 text-body-sm font-medium transition-colors ${addRole === r ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                      {r === "MEMBER" ? "팀원" : "팀장"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-caption text-ink-mute">파트</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button type="button" onClick={() => setAddPart("")}
                    className={`rounded-lg py-2 text-caption font-medium transition-colors ${addPart === "" ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                    없음
                  </button>
                  {PARTS.map((p) => (
                    <button key={p} type="button" onClick={() => setAddPart(p)}
                      className={`rounded-lg py-2 text-caption font-medium transition-colors ${addPart === p ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"}`}>
                      {PART_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {addError && <p className="text-body-sm text-rust">{addError}</p>}
            <button
              type="submit"
              disabled={addLoading || !selectedUser}
              className="self-start h-10 rounded-md bg-ink px-6 text-body font-medium text-paper hover:opacity-80 disabled:opacity-50"
            >
              {addLoading ? "추가 중…" : "팀원 추가"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
