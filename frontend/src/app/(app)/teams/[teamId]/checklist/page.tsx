"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ChecklistCategory, ChecklistItemPublic, ChecklistStatus } from "@/types/api";

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  DOCS: "서류", TEAM_GEAR: "팀 장비", PERSONAL: "개인 준비", MINISTRY: "사역 준비", MISC: "기타",
};
const CATEGORY_ORDER: ChecklistCategory[] = ["DOCS", "TEAM_GEAR", "PERSONAL", "MINISTRY", "MISC"];

const STATUS_NEXT: Record<ChecklistStatus, ChecklistStatus> = {
  todo: "in_progress", in_progress: "done", done: "todo",
};
function StatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage text-paper transition-colors">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 5.5l2.5 2.5L9 3" />
        </svg>
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-mustard bg-mustard/15 transition-colors">
        <span className="h-1.5 w-1.5 rounded-full bg-mustard" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink/25 bg-paper transition-colors hover:border-ink/40" />
  );
}
const STATUS_LABEL: Record<ChecklistStatus, string> = {
  todo: "미완료", in_progress: "진행 중", done: "완료",
};

// ── 진행 막대 ─────────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full rounded-full bg-sage transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="flex-shrink-0 text-body-sm text-ink-mute">{done}/{total} ({pct}%)</span>
    </div>
  );
}

// ── 항목 편집 폼 ─────────────────────────────────────────────────────────────

function EditItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: ChecklistItemPublic;
  onSave: (patch: Partial<ChecklistItemPublic>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [quantity, setQuantity] = useState(item.quantity ?? "");
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await onSave({
      title: title.trim(),
      quantity: quantity.trim() || null,
      due_date: dueDate || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
  };

  const fieldClass = "w-full rounded-md border border-ink/15 bg-paper px-3 py-1.5 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

  return (
    <form onSubmit={submit} className="rounded-md border border-coral/30 bg-paper p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="항목 이름" required className={fieldClass + " flex-1"} />
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)}
          placeholder="수량" className={fieldClass + " w-24"} />
      </div>
      <div className="flex gap-2">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className={fieldClass + " flex-1"} />
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="메모" className={fieldClass + " flex-1"} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="inline-flex h-7 items-center rounded-md border border-ink/20 px-3 text-caption text-ink-soft hover:bg-paper-deep">취소</button>
        <button type="submit" disabled={!title.trim() || busy}
          className="inline-flex h-7 items-center rounded-md bg-ink px-3 text-caption text-paper hover:bg-ink/90 disabled:opacity-40">
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

// ── 항목 행 ───────────────────────────────────────────────────────────────────

function ChecklistRow({
  item,
  onToggle,
  onDelete,
  onEdit,
}: {
  item: ChecklistItemPublic;
  onToggle: (id: string, next: ChecklistStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, patch: Partial<ChecklistItemPublic>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const next = STATUS_NEXT[item.status];

  if (editing) {
    return (
      <li>
        <EditItemForm
          item={item}
          onSave={async (patch) => { await onEdit(item.id, patch); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 rounded-md border border-ink/10 bg-paper p-4 transition-colors hover:border-ink/25">
      {/* 상태 토글 버튼 */}
      <button
        onClick={() => onToggle(item.id, next)}
        title={`${STATUS_LABEL[next]}으로 변경`}
        className="mt-0.5 flex-shrink-0 focus-visible:outline-2 focus-visible:outline-coral focus-visible:outline-offset-2 rounded-full"
      >
        <StatusIcon status={item.status} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <span className={`font-medium text-ink transition-opacity ${item.status === "done" ? "line-through opacity-40" : ""}`}>
            {item.title}
          </span>
          {item.quantity && (
            <span className="rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">{item.quantity}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-ink-mute">
          {item.status === "in_progress" && (
            <span className="rounded px-1.5 py-0.5 text-caption bg-mustard/15 text-mustard">진행 중</span>
          )}
          {item.due_date && <span>마감 {item.due_date}</span>}
          {item.cost_amount && (
            <span>
              {new Intl.NumberFormat("ko-KR", { style: "currency", currency: item.cost_currency, maximumFractionDigits: 0 }).format(parseFloat(item.cost_amount))}
            </span>
          )}
        </div>
        {item.notes && <p className="mt-1 text-body-sm text-ink-mute">{item.notes}</p>}
      </div>

      {/* 수정 / 삭제 버튼 — 모바일 상시 표시, 데스크톱 호버 시 표시 */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:!opacity-100">
        {confirmDel ? (
          <div className="flex items-center gap-1.5 rounded-md border border-rust/30 bg-rust/5 px-2 py-1">
            <span className="text-caption text-rust">삭제?</span>
            <button onClick={() => onDelete(item.id)}
              className="text-caption font-semibold text-rust hover:underline">예</button>
            <button onClick={() => setConfirmDel(false)}
              className="text-caption text-ink-mute hover:text-ink">취소</button>
          </div>
        ) : (
          <>
            <button onClick={() => setEditing(true)} aria-label="수정"
              className="rounded p-1 text-ink-mute hover:text-ink">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" />
              </svg>
            </button>
            <button onClick={() => setConfirmDel(true)} aria-label="삭제"
              className="rounded p-1 text-ink-mute hover:text-rust">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5.5 6v4.5M8.5 6v4.5M3 3.5l.7 8h6.6l.7-8" />
              </svg>
            </button>
          </>
        )}
      </div>
    </li>
  );
}

// ── 항목 추가 폼 ─────────────────────────────────────────────────────────────

function AddItemForm({
  category,
  onAdd,
  onCancel,
}: {
  category: ChecklistCategory;
  onAdd: (title: string, quantity: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await onAdd(title.trim(), quantity.trim());
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-md border border-coral/30 bg-paper p-3">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="항목 이름"
        className="min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-mute focus:outline-none"
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="수량"
        className="w-20 bg-transparent text-body-sm text-ink placeholder:text-ink-mute focus:outline-none"
      />
      <button type="submit" disabled={!title.trim() || busy}
        className="inline-flex h-7 items-center rounded-md bg-ink px-3 text-caption text-paper hover:bg-ink/90 disabled:opacity-40">
        추가
      </button>
      <button type="button" onClick={onCancel}
        className="inline-flex h-7 items-center rounded-md border border-ink/20 px-2.5 text-caption text-ink-soft hover:bg-paper-deep">
        취소
      </button>
    </form>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [items, setItems] = useState<ChecklistItemPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCategory, setAddingCategory] = useState<ChecklistCategory | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/checklist/${teamId}`);
        if (res.ok) setItems((await res.json()).data ?? []);
        else showToast("목록을 불러오지 못했어요.", false);
      } catch { showToast("불러오기에 실패했어요.", false); }
      finally { setLoading(false); }
    };
    load();
  }, [teamId, showToast]);

  const handleToggle = async (id: string, nextStatus: ChecklistStatus) => {
    const prev = items.find((i) => i.id === id)?.status;
    setItems((all) => all.map((i) => i.id === id ? { ...i, status: nextStatus } : i));
    try {
      const res = await fetch(`/api/checklist-item/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setItems((all) => all.map((i) => i.id === id ? { ...i, status: prev ?? i.status } : i));
        showToast("변경에 실패했어요.", false);
      }
    } catch {
      setItems((all) => all.map((i) => i.id === id ? { ...i, status: prev ?? i.status } : i));
      showToast("잠깐 문제가 있었어요.", false);
    }
  };

  const handleDelete = async (id: string) => {
    const backup = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/checklist-item/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setItems(backup);
        showToast("삭제에 실패했어요.", false);
      }
    } catch {
      setItems(backup);
      showToast("잠깐 문제가 있었어요.", false);
    }
  };

  const handleEdit = async (id: string, patch: Partial<ChecklistItemPublic>) => {
    try {
      const res = await fetch(`/api/checklist-item/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "수정에 실패했어요.", false); return; }
      setItems((prev) => prev.map((i) => i.id === id ? json.data : i));
      showToast("수정됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
  };

  const handleAdd = async (category: ChecklistCategory, title: string, quantity: string) => {
    try {
      const res = await fetch(`/api/checklist/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, quantity: quantity || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "추가에 실패했어요.", false); return; }
      setItems((prev) => [...prev, json.data]);
      setAddingCategory(null);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
  };

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ category: cat, label: CATEGORY_LABEL[cat], items: items.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0 || addingCategory === g.category);

  // Also include all categories for the "+ 추가" buttons even if empty
  const allCategories = CATEGORY_ORDER.map((cat) => ({ category: cat, label: CATEGORY_LABEL[cat], items: items.filter((i) => i.category === cat) }));

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8">
        <p className="text-overline uppercase tracking-[0.12em] text-ink-mute">팀</p>
        <h1 className="font-display mt-1 text-h1">준비물</h1>
        {total > 0 && <div className="mt-4"><ProgressBar done={done} total={total} /></div>}
      </header>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-paper-deep" />)}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {allCategories.map(({ category, label, items: catItems }) => {
            const catDone = catItems.filter((i) => i.status === "done").length;
            const isAdding = addingCategory === category;
            if (catItems.length === 0 && !isAdding) {
              // Show collapsed "+" only
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-body-sm font-medium uppercase tracking-wide text-ink-mute">{label}</span>
                  <button onClick={() => setAddingCategory(category)}
                    className="text-body-sm text-ink-mute hover:text-coral transition-colors">
                    + 추가
                  </button>
                </div>
              );
            }
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-body-sm font-medium uppercase tracking-wide text-ink-mute">{label}</h2>
                  <span className="text-caption text-ink-mute">{catDone}/{catItems.length}</span>
                  <button onClick={() => setAddingCategory(isAdding ? null : category)}
                    className="ml-auto text-caption text-ink-mute hover:text-coral transition-colors">
                    {isAdding ? "취소" : "+ 추가"}
                  </button>
                </div>
                <ul className="flex flex-col gap-2">
                  {catItems.map((item) => (
                    <ChecklistRow key={item.id} item={item}
                      onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                  {isAdding && (
                    <li>
                      <AddItemForm
                        category={category}
                        onAdd={(title, quantity) => handleAdd(category, title, quantity)}
                        onCancel={() => setAddingCategory(null)}
                      />
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
