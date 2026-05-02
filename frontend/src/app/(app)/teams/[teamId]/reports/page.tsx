"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

function IconDownload() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.5 2v9M5 8l3.5 3 3.5-3" />
      <path d="M2 13h13" />
    </svg>
  );
}

function IconSheet() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="2" width="22" height="24" rx="2" />
      <path d="M8 8h12M8 12h12M8 16h8" />
      <path d="M3 20h22" />
    </svg>
  );
}

interface ReportItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  downloadFn: () => Promise<void>;
}

export default function ReportsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const downloadFile = async (url: string, defaultFilename: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message ?? "다운로드에 실패했어요.");
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const match = cd.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? defaultFilename;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = decodeURIComponent(filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const reports: ReportItem[] = [
    {
      id: "expenses-xlsx",
      label: "지출 내역 Excel",
      description: "전체 지출을 날짜·카테고리·상태 별로 정리한 Excel 파일입니다. 회계 검토 및 결산에 활용할 수 있어요.",
      icon: <IconSheet />,
      downloadFn: async () => {
        await downloadFile(`/api/reports/${teamId}`, "지출내역.xlsx");
      },
    },
  ];

  const handleDownload = async (item: ReportItem) => {
    setBusy(item.id);
    try {
      await item.downloadFn();
      showToast("다운로드를 시작했어요.", true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "다운로드에 실패했어요.", false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[640px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8">
        <p className="text-overline uppercase tracking-[0.12em] text-ink-mute">회계</p>
        <h1 className="font-display mt-1 text-h1">리포트</h1>
      </header>

      <div className="flex flex-col gap-4">
        {reports.map((item) => (
          <div key={item.id} className="flex items-start gap-5 rounded-md border border-ink/10 bg-paper p-5">
            <div className="flex-shrink-0 text-ink-mute mt-0.5">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-ink">{item.label}</p>
              <p className="mt-1 text-body-sm text-ink-soft">{item.description}</p>
            </div>
            <button
              onClick={() => handleDownload(item)}
              disabled={busy === item.id}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-body-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              {busy === item.id ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
              ) : (
                <IconDownload />
              )}
              {busy === item.id ? "생성 중…" : "다운로드"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md bg-paper-deep px-5 py-4">
        <p className="text-body-sm text-ink-soft">
          <span className="font-medium text-ink">예정된 리포트 :</span>{" "}
          영수증 ZIP 묶음, 카테고리별 예산 대비 실집행 요약, PDF 결산 보고서는 Phase 4(출국 후)에 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}
