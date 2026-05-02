"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

// ── 타입 ──────────────────────────────────────────────────────────────────

type ScheduleKind = "WORSHIP" | "VBS" | "MEAL" | "TRANSPORT" | "DEBRIEF" | "FREE" | "OTHER";

interface ScheduleItem {
  id: string;
  starts_at: string;
  ends_at: string | null;
  title: string;
  kind: ScheduleKind | null;
  location: string | null;
  description: string | null;
}

// ── 상수 ──────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<ScheduleKind, string> = {
  WORSHIP: "예배", VBS: "성경학교", MEAL: "식사",
  TRANSPORT: "이동", DEBRIEF: "디브리핑", FREE: "자유", OTHER: "기타",
};
const KIND_OPTIONS = Object.entries(KIND_LABEL) as [ScheduleKind, string][];
const KIND_EMOJI: Record<ScheduleKind, string> = {
  WORSHIP: "🙏", VBS: "📖", MEAL: "🍽️",
  TRANSPORT: "🚌", DEBRIEF: "💬", FREE: "🌿", OTHER: "📌",
};

const KIND_DOT: Record<ScheduleKind, string> = {
  WORSHIP: "bg-coral", VBS: "bg-ocean", MEAL: "bg-sage",
  TRANSPORT: "bg-mustard", DEBRIEF: "bg-ink-mute", FREE: "bg-ink-mute/40", OTHER: "bg-ink-mute",
};

// ── 유틸 ──────────────────────────────────────────────────────────────────

function toLocalDatetimeStr(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// ── 빈 폼 상태 ────────────────────────────────────────────────────────────

function emptyForm(defaultDate?: string) {
  const now = defaultDate
    ? new Date(defaultDate + "T09:00")
    : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const localStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { title: "", starts_at: localStr, ends_at: "", kind: "" as ScheduleKind | "", location: "", description: "" };
}

// ── 일정 폼 (모달 내부 / 편집 인라인 모두 사용) ───────────────────────────

interface FormState {
  title: string;
  starts_at: string;
  ends_at: string;
  kind: ScheduleKind | "";
  location: string;
  description: string;
}

function ScheduleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const set = (key: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={titleRef}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="일정 제목 *"
        className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-caption text-ink-mute">시작 *</label>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-body-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-caption text-ink-mute">종료 (선택)</label>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-body-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-caption text-ink-mute">종류 (선택)</label>
        <div className="grid grid-cols-4 gap-1.5">
          {/* 선택 없음 */}
          <button
            type="button"
            onClick={() => set("kind", "")}
            className={`rounded-lg py-2 text-caption font-medium transition-colors ${
              form.kind === "" ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"
            }`}
          >
            없음
          </button>
          {KIND_OPTIONS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => set("kind", v)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-2 px-1 text-center transition-colors ${
                form.kind === v ? "bg-ink text-paper" : "bg-paper-deep text-ink-mute hover:bg-ink/10"
              }`}
            >
              <span className="text-base leading-none">{KIND_EMOJI[v]}</span>
              <span className="text-caption leading-tight">{l}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-caption text-ink-mute">장소</label>
        <input
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="예: 본교회 본당"
          className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
        />
      </div>

      <textarea
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="메모 (선택)"
        rows={2}
        className="w-full resize-none rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
      />

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || !form.starts_at || saving}
          className="h-9 rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-40"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          onClick={onCancel}
          className="h-9 rounded-md border border-ink/20 px-4 text-body-sm text-ink-soft hover:bg-paper-deep"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ── 일정 항목 행 ──────────────────────────────────────────────────────────

function ScheduleRow({
  item,
  isAdmin,
  onEdit,
  onDelete,
}: {
  item: ScheduleItem;
  isAdmin: boolean;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const dotColor = item.kind ? (KIND_DOT[item.kind] ?? "bg-ink-mute") : "bg-ink-mute";

  return (
    <li className="group flex gap-4 rounded-md border border-ink/10 bg-paper p-4 transition-colors hover:border-ink/25">
      {/* 시간 */}
      <div className="w-16 flex-shrink-0 text-right text-body-sm text-ink-mute">
        <span className="block font-medium text-ink">{formatTime(item.starts_at)}</span>
        {item.ends_at && <span className="text-caption">{formatTime(item.ends_at)}</span>}
      </div>

      {/* 타임라인 점 */}
      <div className="flex flex-shrink-0 flex-col items-center">
        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <div className="mt-1 w-px flex-1 bg-ink/10" />
      </div>

      {/* 내용 */}
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{item.title}</span>
            {item.kind && (
              <span className="rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">
                {KIND_LABEL[item.kind]}
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="flex flex-shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:!opacity-100">
              {confirmDel ? (
                <>
                  <span className="text-caption text-rust">삭제할까요?</span>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="rounded px-2 py-1 text-caption font-medium text-rust hover:bg-rust/10"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="rounded px-2 py-1 text-caption text-ink-mute hover:bg-paper-deep"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onEdit(item)}
                    className="rounded px-2 py-1 text-caption text-ink-mute hover:bg-paper-deep hover:text-ink"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="rounded px-2 py-1 text-caption text-ink-mute hover:bg-rust/10 hover:text-rust"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {item.location && (
          <p className="mt-1 text-body-sm text-ink-mute">📍 {item.location}</p>
        )}
        {item.description && (
          <p className="mt-1 text-body-sm text-ink-soft">{item.description}</p>
        )}
      </div>
    </li>
  );
}

// ── 모달 ─────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3 font-medium">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-mute hover:bg-paper-deep">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { teamId } = useParams<{ teamId: string }>();

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 추가 모달
  const [addModal, setAddModal] = useState<{ open: boolean; defaultDate?: string }>({ open: false });
  const [addSaving, setAddSaving] = useState(false);

  // 편집 모달
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [schedRes, meRes] = await Promise.all([
          fetch(`/api/schedule/${teamId}`),
          fetch("/api/users/me"),
        ]);
        if (schedRes.ok) setItems((await schedRes.json()).data ?? []);

        if (meRes.ok) {
          const me = (await meRes.json()).data;
          const orgRole = me?.org_role;
          const isOrgAdmin = orgRole === "OWNER" || orgRole === "ADMIN";
          const isDirector = (me?.outreach_memberships ?? []).some((om: { role: string }) => om.role === "DIRECTOR");
          const isStaff = (me?.outreach_memberships ?? []).some((om: { role: string; team_id: string | null }) => om.role === "STAFF" && om.team_id === teamId);
          const isLeader = (me?.team_memberships ?? []).some((tm: { team_id: string; role: string }) => tm.team_id === teamId && tm.role === "LEADER");
          setIsAdmin(isOrgAdmin || isDirector || isStaff || isLeader);
        }
      } catch {
        showToast("데이터를 불러오지 못했어요.", false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, showToast]);

  async function handleAdd(form: ReturnType<typeof emptyForm>) {
    setAddSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        kind: form.kind || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      const res = await fetch(`/api/schedule/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "추가 실패");
      setItems((prev) => [...prev, json.data]);
      setAddModal({ open: false });
      showToast("일정이 추가됐어요.", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류가 발생했어요.", false);
    } finally {
      setAddSaving(false);
    }
  }

  async function handleEdit(form: ReturnType<typeof emptyForm>) {
    if (!editItem) return;
    setEditSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        kind: form.kind || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      const res = await fetch(`/api/schedule-item/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "수정 실패");
      setItems((prev) => prev.map((i) => i.id === editItem.id ? json.data : i));
      setEditItem(null);
      showToast("일정이 수정됐어요.", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류가 발생했어요.", false);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const backup = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/schedule-item/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setItems(backup);
        showToast("삭제에 실패했어요.", false);
      } else {
        showToast("삭제됐어요.", true);
      }
    } catch {
      setItems(backup);
      showToast("잠깐 문제가 있었어요.", false);
    }
  }

  // 날짜별 그룹핑
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...items].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const upcoming: ScheduleItem[] = [];
  const past: ScheduleItem[] = [];
  for (const item of sorted) {
    (dateKey(item.starts_at) >= today ? upcoming : past).push(item);
  }

  function groupByDate(list: ScheduleItem[]) {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of list) {
      const key = dateKey(item.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, dateLabel: formatDate(items[0].starts_at), items }));
  }

  const upcomingGroups = groupByDate(upcoming);
  const pastGroups = groupByDate(past).reverse();

  return (
    <div className="mx-auto max-w-[720px]">
      {/* 토스트 */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">일정</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddModal({ open: true })}
            className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
          >
            + 일정 추가
          </button>
        )}
      </header>

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-paper-deep" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-body text-ink-mute">등록된 일정이 없습니다.</p>
          {isAdmin && (
            <button
              onClick={() => setAddModal({ open: true })}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
            >
              첫 일정 추가하기
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {upcomingGroups.length > 0 && (
            <div className="flex flex-col gap-8">
              {upcomingGroups.map(({ key, dateLabel, items: dayItems }) => {
                const isToday = key === today;
                return (
                  <section key={key}>
                    <div className={`mb-3 flex items-center justify-between ${isToday ? "sticky top-0 z-10 -mx-1 rounded-md bg-paper px-1 py-1 shadow-sm" : ""}`}>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="rounded-full bg-coral px-2 py-0.5 text-caption font-semibold text-paper">오늘</span>
                        )}
                        <h2 className={`font-medium ${isToday ? "text-ink" : "text-ink-soft"}`}>
                          {isToday ? new Date(key).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }) : dateLabel}
                        </h2>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setAddModal({ open: true, defaultDate: key })}
                          className="text-caption text-ink-mute hover:text-coral transition-colors"
                        >
                          + 추가
                        </button>
                      )}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {dayItems.map((item) => (
                        <ScheduleRow
                          key={item.id}
                          item={item}
                          isAdmin={isAdmin}
                          onEdit={setEditItem}
                          onDelete={handleDelete}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          {pastGroups.length > 0 && (
            <section>
              <h2 className="mb-4 text-body-sm font-medium uppercase tracking-wide text-ink-mute">
                지난 일정
              </h2>
              <div className="flex flex-col gap-6">
                {pastGroups.map(({ key, dateLabel, items: dayItems }) => (
                  <div key={key} className="opacity-60">
                    <h3 className="mb-2 text-body-sm font-medium text-ink-soft">{dateLabel}</h3>
                    <ul className="flex flex-col gap-2">
                      {dayItems.map((item) => (
                        <ScheduleRow
                          key={item.id}
                          item={item}
                          isAdmin={isAdmin}
                          onEdit={setEditItem}
                          onDelete={handleDelete}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 일정 추가 모달 */}
      {addModal.open && (
        <Modal title="일정 추가" onClose={() => setAddModal({ open: false })}>
          <ScheduleForm
            initial={emptyForm(addModal.defaultDate)}
            onSave={handleAdd}
            onCancel={() => setAddModal({ open: false })}
            saving={addSaving}
          />
        </Modal>
      )}

      {/* 일정 편집 모달 */}
      {editItem && (
        <Modal title="일정 편집" onClose={() => setEditItem(null)}>
          <ScheduleForm
            initial={{
              title: editItem.title,
              starts_at: toLocalDatetimeStr(editItem.starts_at),
              ends_at: editItem.ends_at ? toLocalDatetimeStr(editItem.ends_at) : "",
              kind: editItem.kind ?? "",
              location: editItem.location ?? "",
              description: editItem.description ?? "",
            }}
            onSave={handleEdit}
            onCancel={() => setEditItem(null)}
            saving={editSaving}
          />
        </Modal>
      )}
    </div>
  );
}
