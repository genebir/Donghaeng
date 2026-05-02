"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { HomeUpdatePublic, HomeUpdateStatus } from "@/types/api";

const STATUS_LABEL: Record<HomeUpdateStatus, string> = {
  draft: "초안", published: "발행됨",
};
const STATUS_CHIP: Record<HomeUpdateStatus, string> = {
  draft: "border-mustard text-mustard",
  published: "border-sage text-sage",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function WriteForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HomeUpdatePublic;
  onSave: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    await onSave(title.trim(), content.trim());
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="rounded-md border border-ink/15 bg-paper p-5">
      <label className="block">
        <span className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-soft">제목</span>
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="오늘의 소식 제목"
          className="mt-2 block w-full border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
          autoFocus
        />
      </label>
      <label className="mt-5 block">
        <span className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-soft">내용</span>
        <textarea
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루 어떠셨나요? 기도제목이나 소식을 나눠주세요."
          rows={6}
          className="mt-2 block w-full resize-none border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
        />
      </label>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={!title.trim() || !content.trim() || busy}
          className="inline-flex h-9 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-40 disabled:pointer-events-none">
          {busy ? "저장 중…" : initial ? "수정 저장" : "임시저장"}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep">
          취소
        </button>
      </div>
    </form>
  );
}

export default function HomeUpdatesPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [updates, setUpdates] = useState<HomeUpdatePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<HomeUpdatePublic | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/home-updates/${teamId}`);
        if (res.ok) setUpdates((await res.json()).data ?? []);
        else showToast("불러오기에 실패했어요.", false);
      } catch { showToast("불러오기에 실패했어요.", false); }
      finally { setLoading(false); }
    };
    load();
  }, [teamId, showToast]);

  const handleCreate = async (title: string, content: string) => {
    try {
      const res = await fetch(`/api/home-updates/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "저장 실패", false); return; }
      setUpdates((prev) => [json.data, ...prev]);
      setWriting(false);
      showToast("임시저장됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
  };

  const handleEdit = async (update: HomeUpdatePublic, title: string, content: string) => {
    try {
      const res = await fetch(`/api/home-update/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, teamId }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "수정 실패", false); return; }
      setUpdates((prev) => prev.map((u) => u.id === update.id ? json.data : u));
      setEditing(null);
      showToast("수정됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    const backup = updates;
    setUpdates((prev) => prev.filter((u) => u.id !== id));
    try {
      const res = await fetch(`/api/home-update/${id}?teamId=${teamId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setUpdates(backup);
        showToast("삭제에 실패했어요.", false);
      } else {
        showToast("삭제됐어요.", true);
      }
    } catch {
      setUpdates(backup);
      showToast("잠깐 문제가 있었어요.", false);
    }
  };

  const handlePublish = async (update: HomeUpdatePublic) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/home-update/${update.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "발행 실패", false); return; }
      setUpdates((prev) => prev.map((u) => u.id === update.id ? json.data : u));
      showToast("발행됐어요. 본진 공유 페이지에 표시됩니다.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-[0.12em] text-ink-mute">본진 공유</p>
          <h1 className="font-display mt-1 text-h1">소식</h1>
        </div>
        {!writing && !editing && (
          <button onClick={() => setWriting(true)}
            className="inline-flex h-9 flex-shrink-0 items-center rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:bg-ink/90 active:translate-y-px transition">
            + 새 소식
          </button>
        )}
      </header>

      {writing && (
        <div className="mb-6">
          <WriteForm onSave={handleCreate} onCancel={() => setWriting(false)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-md bg-paper-deep" />)}</div>
      ) : updates.length === 0 && !writing ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-mute">아직 소식이 없어요.</p>
          <p className="mt-2 text-body-sm text-ink-mute">새 소식을 작성하면 본진에 공유할 수 있어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {updates.map((u) => (
            <article key={u.id} className="rounded-md border border-ink/10 bg-paper p-5">
              {editing?.id === u.id ? (
                <WriteForm
                  initial={u}
                  onSave={(title, content) => handleEdit(u, title, content)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="mb-2 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-body font-medium text-ink">{u.title}</h2>
                        <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide ${STATUS_CHIP[u.status]}`}>
                          {STATUS_LABEL[u.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-caption text-ink-mute">
                        {u.published_at ? `발행 ${formatDate(u.published_at)}` : `작성 ${formatDate(u.created_at)}`}
                      </p>
                    </div>
                  </div>
                  {/* 본문 — 길면 펼치기 */}
                  <div>
                    <p className={`text-body-sm text-ink-soft whitespace-pre-wrap ${expandedIds.has(u.id) ? "" : "line-clamp-3"}`}>
                      {u.content}
                    </p>
                    {u.content.length > 120 && (
                      <button
                        onClick={() => setExpandedIds((prev) => {
                          const next = new Set(prev);
                          next.has(u.id) ? next.delete(u.id) : next.add(u.id);
                          return next;
                        })}
                        className="mt-1 text-caption text-ocean hover:underline"
                      >
                        {expandedIds.has(u.id) ? "접기" : "더 보기"}
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {u.status === "draft" && (
                      <button onClick={() => handlePublish(u)} disabled={busy}
                        className="inline-flex h-8 items-center rounded-md bg-coral px-3 text-body-sm text-paper hover:bg-coral/90 disabled:opacity-50">
                        본진에 발행
                      </button>
                    )}
                    <button onClick={() => { setWriting(false); setEditing(u); }}
                      className="inline-flex h-8 items-center rounded-md border border-ink/20 px-3 text-body-sm text-ink hover:bg-paper-deep">
                      수정
                    </button>
                    {confirmDeleteId === u.id ? (
                      <div className="flex items-center gap-2 rounded-md border border-rust/30 bg-rust/5 px-3 py-1">
                        <span className="text-body-sm text-rust">삭제할까요?</span>
                        <button onClick={() => handleDelete(u.id)}
                          className="text-body-sm font-medium text-rust hover:underline">삭제</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="text-body-sm text-ink-mute hover:text-ink">취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(u.id)}
                        className="inline-flex h-8 items-center rounded-md px-3 text-body-sm text-ink-mute hover:text-rust transition-colors">
                        삭제
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
