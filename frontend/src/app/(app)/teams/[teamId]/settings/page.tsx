"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Destination {
  church_name: string;
  address: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  timezone: string;
  notes: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  description: string | null;
  destination: Destination | null;
}

const STATUS_OPTIONS = [
  { value: "planning", label: "기획 중" },
  { value: "ongoing", label: "진행 중" },
  { value: "finished", label: "완료" },
  { value: "archived", label: "보관" },
];

const inputClass = "w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body-sm font-medium text-ink-soft">
        {label}
        {optional && <span className="ml-1 text-caption text-ink-mute">(선택)</span>}
      </label>
      {children}
    </div>
  );
}

export default function TeamSettingsPage() {
  const { teamId } = useParams<{ teamId: string }>();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // 팀 기본 설정
  const [teamForm, setTeamForm] = useState({ name: "", status: "planning", description: "" });
  const [teamSaving, setTeamSaving] = useState(false);

  // 방문지 설정
  const [destForm, setDestForm] = useState({
    church_name: "", address: "", coordinator_name: "",
    coordinator_phone: "", coordinator_email: "", timezone: "Asia/Seoul", notes: "",
  });
  const [destSaving, setDestSaving] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const t: TeamDetail = json.data;
        setTeam(t);
        setTeamForm({
          name: t.name,
          status: t.status,
          description: t.description ?? "",
        });
        if (t.destination) {
          setDestForm({
            church_name: t.destination.church_name,
            address: t.destination.address ?? "",
            coordinator_name: t.destination.coordinator_name ?? "",
            coordinator_phone: t.destination.coordinator_phone ?? "",
            coordinator_email: t.destination.coordinator_email ?? "",
            timezone: t.destination.timezone ?? "Asia/Seoul",
            notes: t.destination.notes ?? "",
          });
        }
      } catch {
        showToast("팀 정보를 불러오지 못했어요.", false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, showToast]);

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    setTeamSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamForm.name.trim(),
          status: teamForm.status,
          description: teamForm.description.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "저장 실패");
      showToast("팀 정보가 저장됐어요.", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류가 발생했어요.", false);
    } finally {
      setTeamSaving(false);
    }
  }

  async function handleSaveDest(e: React.FormEvent) {
    e.preventDefault();
    if (!destForm.church_name.trim()) return showToast("교회 이름을 입력해주세요.", false);
    setDestSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          church_name: destForm.church_name.trim(),
          address: destForm.address.trim() || null,
          coordinator_name: destForm.coordinator_name.trim() || null,
          coordinator_phone: destForm.coordinator_phone.trim() || null,
          coordinator_email: destForm.coordinator_email.trim() || null,
          timezone: destForm.timezone || "Asia/Seoul",
          notes: destForm.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "저장 실패");
      showToast("방문지 정보가 저장됐어요.", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류가 발생했어요.", false);
    } finally {
      setDestSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px]">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-md bg-paper-deep" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8">
        <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
        <h1 className="font-display mt-1 text-h1">설정</h1>
      </header>

      {/* 팀 기본 정보 */}
      <section className="mb-10">
        <h2 className="mb-5 text-h3 font-medium">기본 정보</h2>
        <form onSubmit={handleSaveTeam} className="flex flex-col gap-4">
          <Field label="팀 이름">
            <input
              value={teamForm.name}
              onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
              required
              className={inputClass}
            />
          </Field>
          <Field label="진행 상태">
            <select
              value={teamForm.status}
              onChange={(e) => setTeamForm((f) => ({ ...f, status: e.target.value }))}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="팀 소개" optional>
            <textarea
              value={teamForm.description}
              onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="팀에 대한 간단한 설명"
              className={inputClass + " resize-none"}
            />
          </Field>
          <div>
            <button
              type="submit"
              disabled={teamSaving}
              className="h-10 rounded-md bg-ink px-6 text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-50"
            >
              {teamSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </section>

      {/* 방문지 정보 */}
      <section className="border-t border-ink/10 pt-10">
        <div className="mb-5">
          <h2 className="text-h3 font-medium">방문지 정보</h2>
          <p className="mt-1 text-body-sm text-ink-mute">사역지 교회 담당자 연락처 등을 입력해주세요.</p>
        </div>
        <form onSubmit={handleSaveDest} className="flex flex-col gap-4">
          <Field label="교회 이름">
            <input
              value={destForm.church_name}
              onChange={(e) => setDestForm((f) => ({ ...f, church_name: e.target.value }))}
              placeholder="예: 우도교회"
              required
              className={inputClass}
            />
          </Field>
          <Field label="주소" optional>
            <input
              value={destForm.address}
              onChange={(e) => setDestForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="예: 제주특별자치도 제주시 우도면"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="담당자 이름" optional>
              <input
                value={destForm.coordinator_name}
                onChange={(e) => setDestForm((f) => ({ ...f, coordinator_name: e.target.value }))}
                placeholder="홍길동 목사"
                className={inputClass}
              />
            </Field>
            <Field label="담당자 연락처" optional>
              <input
                value={destForm.coordinator_phone}
                onChange={(e) => setDestForm((f) => ({ ...f, coordinator_phone: e.target.value }))}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="담당자 이메일" optional>
            <input
              type="email"
              value={destForm.coordinator_email}
              onChange={(e) => setDestForm((f) => ({ ...f, coordinator_email: e.target.value }))}
              placeholder="pastor@church.kr"
              className={inputClass}
            />
          </Field>
          <Field label="특이사항 / 메모" optional>
            <textarea
              value={destForm.notes}
              onChange={(e) => setDestForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="예: 섬 지역으로 배편 필요, 숙소 교회 내 마련"
              className={inputClass + " resize-none"}
            />
          </Field>
          <div>
            <button
              type="submit"
              disabled={destSaving}
              className="h-10 rounded-md bg-ink px-6 text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-50"
            >
              {destSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
