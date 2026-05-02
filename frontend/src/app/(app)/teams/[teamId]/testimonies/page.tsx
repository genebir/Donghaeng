"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

// ── 타입 ──────────────────────────────────────────────────────────────────

type TestimonyKind = "testimony" | "prayer_request";
type TestimonyVisibility = "team" | "public" | "anonymous";

interface Testimony {
  id: string;
  kind: TestimonyKind;
  visibility: TestimonyVisibility;
  content: string;
  is_featured: boolean;
  submitted_name: string | null;
  submitter_user_id: string | null;
  created_at: string;
}

interface QrToken {
  id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

// ── 상수 ──────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<TestimonyKind, string> = {
  testimony: "간증",
  prayer_request: "기도제목",
};
const KIND_CHIP: Record<TestimonyKind, string> = {
  testimony: "border-coral text-coral",
  prayer_request: "border-ocean text-ocean",
};
const VIS_LABEL: Record<TestimonyVisibility, string> = {
  team: "팀 내부",
  public: "공개",
  anonymous: "익명",
};

const VIS_OPTIONS: { value: TestimonyVisibility; label: string; desc: string }[] = [
  { value: "team",      label: "팀 내부", desc: "팀원만 볼 수 있어요" },
  { value: "public",    label: "공개",    desc: "본진 공유 페이지에도 노출돼요" },
  { value: "anonymous", label: "익명",    desc: "이름 없이 제출해요" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── QR 모달 ───────────────────────────────────────────────────────────────

function QrModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${label || "qr"}.svg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div className="flex flex-col items-center gap-5 rounded-md bg-paper p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-sm bg-white p-4">
          <QRCodeSVG
            ref={svgRef as React.Ref<SVGSVGElement>}
            value={url}
            size={220}
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="text-center">
          <p className="text-body font-medium text-ink">{label || "QR 코드"}</p>
          <p className="mt-1 truncate max-w-[240px] font-mono text-caption text-ink-mute">{url}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadSvg}
            className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:bg-ink/90"
          >
            SVG 저장
          </button>
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QR 패널 ───────────────────────────────────────────────────────────────

function QrPanel({ teamId }: { teamId: string }) {
  const [tokens, setTokens] = useState<QrToken[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<QrToken | null>(null);

  useEffect(() => {
    fetch(`/api/testimonies/${teamId}/qr-tokens`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.data) setTokens(json.data); })
      .catch(() => {});
  }, [teamId]);

  const createToken = async () => {
    setBusy(true);
    const res = await fetch(`/api/testimonies/${teamId}/qr-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) { setTokens((prev) => [json.data, ...prev]); setLabel(""); }
    setBusy(false);
  };

  const qrUrl = (t: QrToken) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/qr/${t.token}`;

  const copyUrl = async (t: QrToken) => {
    await navigator.clipboard.writeText(qrUrl(t)).catch(() => {});
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-md border border-ink/10 bg-paper p-5">
      <h2 className="text-h3 font-medium">QR 토큰</h2>
      <p className="mt-1 text-body-sm text-ink-soft">QR 코드를 인쇄해 현장에 붙이면 누구나 기도제목·간증을 남길 수 있어요.</p>

      <div className="mt-4 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="QR 이름 (예: 예배당 입구)"
          className="flex-1 rounded-md border border-ink/20 bg-transparent px-3 py-2 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
        />
        <button
          onClick={createToken}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {busy ? "생성 중…" : "+ 생성"}
        </button>
      </div>

      {showQrModal && (
        <QrModal
          url={qrUrl(showQrModal)}
          label={showQrModal.label ?? "QR 코드"}
          onClose={() => setShowQrModal(null)}
        />
      )}

      {tokens.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-sm border border-ink/10 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-ink">{t.label ?? "이름 없는 QR"}</p>
                <p className="truncate font-mono text-caption text-ink-mute">{qrUrl(t)}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => setShowQrModal(t)}
                  className="text-caption text-ink-soft hover:text-ink hover:underline"
                >
                  QR 보기
                </button>
                <button
                  onClick={() => copyUrl(t)}
                  className="text-caption text-ocean hover:underline"
                >
                  {copied === t.id ? "복사됨!" : "복사"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── 간증 카드 ─────────────────────────────────────────────────────────────

function TestimonyCard({
  t,
  onToggleFeatured,
  onDelete,
}: {
  t: Testimony;
  onToggleFeatured?: (id: string, next: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <article className="group rounded-md border border-ink/10 bg-paper p-5">
      <div className="mb-2 flex flex-wrap items-start gap-2">
        <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide ${KIND_CHIP[t.kind]}`}>
          {KIND_LABEL[t.kind]}
        </span>
        <span className="inline-flex items-center rounded-sm border border-ink/20 px-1.5 py-0.5 text-caption text-ink-mute">
          {VIS_LABEL[t.visibility]}
        </span>
        {t.is_featured && (
          <span className="inline-flex items-center rounded-sm border border-mustard/50 px-1.5 py-0.5 text-caption font-semibold text-mustard">
            ★ 주목
          </span>
        )}
        <span className="ml-auto text-caption text-ink-mute">{formatDate(t.created_at)}</span>
      </div>
      {t.submitted_name && (
        <p className="mb-1 text-body-sm font-medium text-ink-soft">{t.submitted_name}</p>
      )}
      <p className="whitespace-pre-wrap text-body-sm text-ink">{t.content}</p>

      {(onToggleFeatured || onDelete) && (
        <div className="mt-3 flex items-center gap-2 border-t border-ink/8 pt-3">
          {onToggleFeatured && (
            <button
              onClick={() => onToggleFeatured(t.id, !t.is_featured)}
              className={`inline-flex h-7 items-center rounded px-2.5 text-caption font-medium transition-colors ${
                t.is_featured
                  ? "bg-mustard/15 text-mustard hover:bg-mustard/25"
                  : "bg-ink/5 text-ink-mute hover:bg-mustard/10 hover:text-mustard"
              }`}
            >
              {t.is_featured ? "★ 주목 해제" : "☆ 주목"}
            </button>
          )}
          {onDelete && (
            confirmDel ? (
              <div className="flex items-center gap-2 rounded-md border border-rust/30 bg-rust/5 px-2.5 py-1">
                <span className="text-caption text-rust">삭제할까요?</span>
                <button onClick={() => onDelete(t.id)}
                  className="text-caption font-semibold text-rust hover:underline">삭제</button>
                <button onClick={() => setConfirmDel(false)}
                  className="text-caption text-ink-mute hover:text-ink">취소</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)}
                className="ml-auto inline-flex h-7 items-center rounded px-2.5 text-caption text-ink-mute hover:text-rust transition-colors">
                삭제
              </button>
            )
          )}
        </div>
      )}
    </article>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────

type FilterKind = "all" | TestimonyKind;

export default function TestimoniesPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [showQr, setShowQr] = useState(false);
  const [writing, setWriting] = useState(false);

  // 작성 폼 상태
  const [formContent, setFormContent] = useState("");
  const [formKind, setFormKind] = useState<TestimonyKind>("testimony");
  const [formVisibility, setFormVisibility] = useState<TestimonyVisibility>("team");
  const [formName, setFormName] = useState("");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // 항상 전체 목록을 불러오고, 필터는 클라이언트에서 처리
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, meRes] = await Promise.all([
        fetch(`/api/testimonies/${teamId}`),
        meId === null ? fetch("/api/users/me") : Promise.resolve(null),
      ]);
      if (tRes.ok) setTestimonies((await tRes.json()).data ?? []);
      if (meRes?.ok) {
        const me = (await meRes.json()).data;
        setMeId(me?.id ?? null);
        const orgRole = me?.org_role;
        const isOrgAdmin = orgRole === "OWNER" || orgRole === "ADMIN";
        const isDirector = (me?.outreach_memberships ?? []).some((om: { role: string }) => om.role === "DIRECTOR");
        const isStaff = (me?.outreach_memberships ?? []).some((om: { role: string; team_id: string | null }) => om.role === "STAFF" && om.team_id === teamId);
        const isLeader = (me?.team_memberships ?? []).some((tm: { team_id: string; role: string }) => tm.team_id === teamId && tm.role === "LEADER");
        setIsAdmin(isOrgAdmin || isDirector || isStaff || isLeader);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [teamId]); // meId intentionally excluded to avoid infinite loop

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!writing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWriting(false);
        setFormContent("");
        setFormName("");
        setFormVisibility("team");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [writing]);

  // 클라이언트 필터 + 주목 항목 상단 정렬
  const tabFiltered = filter === "all" ? testimonies : testimonies.filter((t) => t.kind === filter);
  const displayed = [...tabFiltered].sort((a, b) => {
    if (a.is_featured === b.is_featured) return 0;
    return a.is_featured ? -1 : 1;
  });

  // 탭 카운트
  const kindCounts: Record<TestimonyKind, number> = {
    testimony: testimonies.filter((t) => t.kind === "testimony").length,
    prayer_request: testimonies.filter((t) => t.kind === "prayer_request").length,
  };

  const handleToggleFeatured = async (id: string, next: boolean) => {
    setTestimonies((prev) => prev.map((t) => t.id === id ? { ...t, is_featured: next } : t));
    const res = await fetch(`/api/testimony/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: next }),
    });
    if (!res.ok) {
      setTestimonies((prev) => prev.map((t) => t.id === id ? { ...t, is_featured: !next } : t));
      showToast("변경에 실패했어요.", false);
    }
  };

  const handleDeleteTestimony = async (id: string) => {
    const backup = testimonies;
    setTestimonies((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/testimony/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      setTestimonies(backup);
      showToast("삭제에 실패했어요.", false);
    } else {
      showToast("삭제됐어요.", true);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/testimonies/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: formKind,
          content: formContent.trim(),
          visibility: formVisibility,
          submitted_name: formVisibility !== "anonymous" && formName.trim() ? formName.trim() : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(json.message ?? "저장 실패", false); return; }
      setTestimonies((prev) => [json.data, ...prev]);
      setFormContent("");
      setFormName("");
      setFormVisibility("team");
      setWriting(false);
      showToast("작성됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const tabs: { value: FilterKind; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "testimony", label: "간증" },
    { value: "prayer_request", label: "기도제목" },
  ];

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="tracking-overline uppercase text-overline text-ink-mute">간증 · 기도제목</p>
          <h1 className="font-display mt-1 text-h1">간증</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQr((v) => !v)}
            className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep transition"
          >
            QR 관리
          </button>
          {!writing && (
            <button
              onClick={() => setWriting(true)}
              className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:bg-ink/90 transition"
            >
              + 작성
            </button>
          )}
        </div>
      </header>

      {/* QR 패널 */}
      {showQr && (
        <div className="mb-6">
          <QrPanel teamId={teamId} />
        </div>
      )}

      {/* 작성 폼 */}
      {writing && (
        <form onSubmit={handleCreate} className="mb-6 rounded-md border border-ink/15 bg-paper p-5">
          {/* 종류 선택 */}
          <div className="mb-4 flex gap-3">
            {(["testimony", "prayer_request"] as TestimonyKind[]).map((k) => (
              <label
                key={k}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border-2 py-2 text-body-sm font-medium transition ${
                  formKind === k ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink-soft hover:border-ink/40 hover:text-ink"
                }`}
              >
                <input type="radio" className="sr-only" checked={formKind === k} onChange={() => setFormKind(k)} />
                {KIND_LABEL[k]}
              </label>
            ))}
          </div>

          {/* 내용 */}
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder={formKind === "testimony" ? "하나님이 행하신 일을 나눠주세요." : "함께 기도할 제목을 적어주세요."}
            rows={5}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && formContent.trim() && !busy) {
                e.preventDefault();
                handleCreate(e as unknown as React.FormEvent);
              }
            }}
            className="block w-full resize-none border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
          />

          {/* 공개 범위 */}
          <div className="mt-4">
            <p className="mb-2 text-body-sm font-medium text-ink-soft">공개 범위</p>
            <div className="grid grid-cols-3 gap-2">
              {VIS_OPTIONS.map((v) => (
                <label
                  key={v.value}
                  className={`flex cursor-pointer flex-col items-center rounded-md border-2 px-2 py-2.5 text-center transition ${
                    formVisibility === v.value
                      ? "border-ink bg-ink/5"
                      : "border-ink/15 hover:border-ink/30"
                  }`}
                >
                  <input type="radio" className="sr-only" checked={formVisibility === v.value} onChange={() => setFormVisibility(v.value)} />
                  <span className={`text-body-sm font-medium ${formVisibility === v.value ? "text-ink" : "text-ink-soft"}`}>
                    {v.label}
                  </span>
                  <span className="mt-0.5 text-caption text-ink-mute">{v.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 이름 (익명이 아닐 때만) */}
          {formVisibility !== "anonymous" && (
            <div className="mt-3">
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="이름 (선택, 비워두면 표시 안 됨)"
                className="w-full rounded-md border border-ink/20 bg-transparent px-3 py-2 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
              />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={!formContent.trim() || busy}
              className="inline-flex h-9 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-40"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => { setWriting(false); setFormContent(""); setFormName(""); setFormVisibility("team"); }}
              className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 필터 탭 */}
      <div className="mb-4 flex gap-1 border-b border-ink/10 pb-1">
        {tabs.map((tab) => {
          const count = tab.value === "all" ? testimonies.length : kindCounts[tab.value as TestimonyKind];
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-sm px-3 py-1.5 text-body-sm font-medium transition ${filter === tab.value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-caption ${filter === tab.value ? "opacity-60" : "text-ink-mute"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-md bg-paper-deep" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-mute">
            아직 {filter === "all" ? "간증이나 기도제목이" : KIND_LABEL[filter as TestimonyKind] + "이"} 없어요.
          </p>
          <p className="mt-2 text-body-sm text-ink-mute">QR 코드를 인쇄해 현장에 붙이거나 직접 작성해보세요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((t) => (
            <TestimonyCard
              key={t.id}
              t={t}
              onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
              onDelete={isAdmin || t.submitter_user_id === meId ? handleDeleteTestimony : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
