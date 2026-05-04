"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { MediaAssetPublic } from "@/types/api";
import { useTeamRole } from "@/hooks/useTeamRole";

// ── 아이콘 ─────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.5 11V3M5 6l3.5-3 3.5 3" />
      <path d="M2 13h13" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.5 4.5l9 5.5-9 5.5V4.5z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 2v7M4 6.5l3 3 3-3" />
      <path d="M2 11h10" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

// ── 업로드 상태 ───────────────────────────────────────────────────────────

interface UploadItem {
  localId: string;
  file: File;
  previewUrl: string;
  progress: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── 날짜 레이블 ──────────────────────────────────────────────────────────

function dateSectionLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "오늘";
  if (d.toDateString() === yesterday.toDateString()) return "어제";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// ── 사진 카드 ─────────────────────────────────────────────────────────────

function PhotoCard({
  asset,
  canDelete,
  onSelect,
  onDelete,
}: {
  asset: MediaAssetPublic;
  canDelete: boolean;
  onSelect: (a: MediaAssetPublic) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const isVid = asset.kind === "video" || asset.content_type.startsWith("video/");

  // 3초 후 자동 취소
  useEffect(() => {
    if (!confirmDel) return;
    const t = setTimeout(() => setConfirmDel(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDel]);

  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded-sm bg-paper-deep">
      <button
        onClick={() => onSelect(asset)}
        className="h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
      >
        {asset.view_url && !isVid ? (
          <img
            src={asset.view_url}
            alt={asset.filename}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-mute bg-paper-deep">
            {isVid ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/15 text-ink-soft group-hover:bg-ink/25 transition-colors">
                <IconPlay />
              </div>
            ) : (
              <IconImage />
            )}
          </div>
        )}
        {/* 비디오 오버레이 — 썸네일이 있는 경우 */}
        {isVid && asset.view_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/25 transition-colors group-hover:bg-ink/35">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/70 text-paper">
              <IconPlay />
            </div>
          </div>
        )}
      </button>
      {asset.is_selected && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral shadow" />
      )}

      {/* 삭제 버튼 — 업로드한 본인 또는 관리자만 표시 */}
      {canDelete && (
        confirmDel ? (
          <div
            className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-rust/90 px-1.5 py-1 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-medium text-paper">삭제?</span>
            <button
              onClick={() => onDelete(asset.id)}
              className="text-[10px] font-bold text-paper underline underline-offset-1 hover:text-rust-light"
            >
              예
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="text-[10px] text-paper/70 hover:text-paper"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }}
            aria-label="삭제"
            className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rust/90"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        )
      )}
    </div>
  );
}

// ── 업로드 중 카드 ────────────────────────────────────────────────────────

function UploadCard({ item }: { item: UploadItem }) {
  const isVid = item.file.type.startsWith("video/");
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper-deep">
      {isVid ? (
        <div className="flex h-full w-full items-center justify-center bg-paper-deep">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/15 text-ink-soft">
            <IconPlay />
          </div>
        </div>
      ) : (
        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover opacity-60" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        {item.progress === "uploading" && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-paper border-t-transparent" />
        )}
        {item.progress === "error" && (
          <div className="rounded-sm bg-rust/90 px-2 py-1 text-caption text-paper">실패</div>
        )}
      </div>
    </div>
  );
}

// ── 라이트박스 ────────────────────────────────────────────────────────────

function Lightbox({
  asset,
  assets,
  canDelete,
  onClose,
  onDelete,
  onNavigate,
}: {
  asset: MediaAssetPublic;
  assets: MediaAssetPublic[];
  canDelete: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNavigate: (asset: MediaAssetPublic) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const idx = assets.findIndex((a) => a.id === asset.id);
  const hasPrev = idx > 0;
  const hasNext = idx < assets.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) { setConfirmDel(false); onNavigate(assets[idx - 1]); }
      if (e.key === "ArrowRight" && hasNext) { setConfirmDel(false); onNavigate(assets[idx + 1]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, assets, idx, hasPrev, hasNext]);

  const isVid = asset.kind === "video" || asset.content_type.startsWith("video/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {asset.view_url && (
          isVid ? (
            <video
              src={asset.view_url}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-sm"
            />
          ) : (
            <img
              src={asset.view_url}
              alt={asset.filename}
              className="max-h-[80vh] max-w-full rounded-sm object-contain"
            />
          )
        )}
        <div className="mt-2 flex items-center gap-3">
          <p className="flex-1 text-caption text-paper/70 truncate">{asset.filename}</p>
          {asset.byte_size && (
            <p className="text-caption text-paper/50">{formatBytes(asset.byte_size)}</p>
          )}
          <p className="text-caption text-paper/50">{formatDate(asset.created_at)}</p>
          {assets.length > 1 && (
            <p className="text-caption text-paper/40">{idx + 1}/{assets.length}</p>
          )}
          {asset.view_url && (
            <a
              href={asset.view_url}
              download={asset.filename}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="다운로드"
              className="text-paper/40 hover:text-paper transition-colors"
            >
              <IconDownload />
            </a>
          )}
          {canDelete && (confirmDel ? (
            <div className="flex items-center gap-2">
              <span className="text-caption text-rust">삭제할까요?</span>
              <button onClick={() => { onDelete(asset.id); onClose(); }}
                className="text-caption font-medium text-rust hover:underline">삭제</button>
              <button onClick={() => setConfirmDel(false)}
                className="text-caption text-paper/50 hover:text-paper">취소</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="text-caption text-paper/40 hover:text-rust transition-colors">
              삭제
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-ink/80"
        >
          <IconClose />
        </button>
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDel(false); onNavigate(assets[idx - 1]); }}
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-paper hover:bg-ink/80 transition-colors"
            aria-label="이전"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDel(false); onNavigate(assets[idx + 1]); }}
            className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-paper hover:bg-ink/80 transition-colors"
            aria-label="다음"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────

export default function MediaPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { isAdmin } = useTeamRole();
  const [assets, setAssets] = useState<MediaAssetPublic[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selected, setSelected] = useState<MediaAssetPublic | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [mediaRes, meRes] = await Promise.all([
        fetch(`/api/media/${teamId}`),
        fetch("/api/users/me"),
      ]);
      if (mediaRes.ok) setAssets((await mediaRes.json()).data ?? []);
      if (meRes.ok) setMeId(((await meRes.json()).data)?.id ?? null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [teamId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const uploadFile = useCallback(async (file: File, localId: string) => {
    setUploads((prev) => prev.map((u) => u.localId === localId ? { ...u, progress: "uploading" } : u));

    try {
      // Step 1: presign
      const presignRes = await fetch(`/api/media/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          byte_size: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error("presign 실패");
      const { data: presign } = await presignRes.json();

      // Step 2: PUT to storage
      const putRes = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("업로드 실패");

      // Step 3: complete
      const completeRes = await fetch(`/api/media-complete/${presign.media_id}`, {
        method: "POST",
      });
      if (!completeRes.ok) throw new Error("완료 처리 실패");
      const { data: newAsset } = await completeRes.json();

      setAssets((prev) => [newAsset, ...prev]);
      setUploads((prev) => prev.filter((u) => u.localId !== localId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setUploads((prev) => prev.map((u) => u.localId === localId ? { ...u, progress: "error", errorMsg: msg } : u));
      showToast(msg, false);
    }
  }, [teamId, showToast]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        showToast(`${file.name}: 이미지/영상 파일만 올릴 수 있어요.`, false);
        return;
      }
      const localId = `${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      const item: UploadItem = { localId, file, previewUrl, progress: "pending" };
      setUploads((prev) => [item, ...prev]);
      uploadFile(file, localId);
    });
  }, [uploadFile, showToast]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = useCallback(async (id: string) => {
    const backup = assets;
    setAssets((prev) => prev.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/media-asset/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        setAssets(backup);
        showToast("삭제에 실패했어요.", false);
      } else {
        showToast("사진을 삭제했어요.", true);
      }
    } catch {
      setAssets(backup);
      showToast("잠깐 문제가 있었어요.", false);
    }
  }, [assets, showToast]);

  const isEmpty = !loading && assets.length === 0 && uploads.length === 0;
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="mx-auto max-w-[900px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      {selected && (
        <Lightbox
          asset={selected}
          assets={assets}
          canDelete={isAdmin || selected.uploader_user_id === meId}
          onClose={() => setSelected(null)}
          onDelete={(id) => { handleDelete(id); setSelected(null); }}
          onNavigate={setSelected}
        />
      )}

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-overline uppercase tracking-overline text-ink-mute">팀 미디어</p>
          <h1 className="font-display mt-1 text-h1">
            미디어<span className="text-coral">.</span>
            {assets.length > 0 && (
              <span className="ml-2 text-h2 font-normal text-ink-mute">{assets.length}</span>
            )}
          </h1>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:bg-ink/90 active:translate-y-px transition"
        >
          <IconUpload />
          올리기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onInputChange}
          className="sr-only"
        />
      </header>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-ink/15 py-20 text-center transition-colors hover:border-ink/30"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="text-ink-mute"><IconImage /></div>
          <div>
            <p className="text-body text-ink-mute">아직 미디어가 없어요.</p>
            <p className="mt-1 text-body-sm text-ink-mute">
              사진·영상을 드래그하거나{" "}
              <button onClick={() => fileInputRef.current?.click()} className="underline underline-offset-2 text-ink">
                파일을 선택
              </button>
              해 올리세요.
            </p>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { setIsDragOver(false); onDrop(e); }}
          className={`transition-all rounded-md ${isDragOver ? "ring-2 ring-ink/30 ring-offset-2" : ""}`}
        >
          {/* 업로드 중 항목 — 항상 상단에 */}
          {uploads.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-body-sm font-medium text-ink-mute">업로드 중…</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
                {uploads.map((item) => (
                  <UploadCard key={item.localId} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* 스켈레톤 */}
          {loading && assets.length === 0 && (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-sm bg-paper-deep" />
              ))}
            </div>
          )}

          {/* 날짜별 그룹 */}
          {(() => {
            const groups = new Map<string, MediaAssetPublic[]>();
            for (const a of assets) {
              const k = dateKey(a.created_at);
              if (!groups.has(k)) groups.set(k, []);
              groups.get(k)!.push(a);
            }
            return Array.from(groups.entries()).map(([key, group]) => (
              <section key={key} className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-body-sm font-medium text-ink-mute">
                    {dateSectionLabel(group[0].created_at)}
                  </h2>
                  <span className="text-caption text-ink-mute">{group.length}개</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
                  {group.map((a) => (
                    <PhotoCard key={a.id} asset={a} canDelete={isAdmin || a.uploader_user_id === meId} onSelect={setSelected} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
