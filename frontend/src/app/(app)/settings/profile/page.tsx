"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

interface OutreachMembership {
  outreach_id: string;
  outreach_name: string;
  role: "DIRECTOR" | "STAFF";
  team_id: string | null;
  team_name: string | null;
}

interface TeamMembership {
  team_id: string;
  team_name: string;
  outreach_name: string;
  role: "LEADER" | "MEMBER";
  part: string | null;
  is_part_lead: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  profile_image_url: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account_number_masked: string | null;
  bank_account_holder: string | null;
  org_role: string | null;
  outreach_memberships: OutreachMembership[];
  team_memberships: TeamMembership[];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-caption font-semibold uppercase tracking-overline text-ink-soft">
      {children}
    </span>
  );
}

function UnderlineInput({
  id,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      className="mt-2 block w-full border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export default function ProfileSettingsPage() {
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus") as "phone" | "bank" | null;
  const phoneRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
  });

  const showToast = useCallback((message: string, type: "ok" | "err") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((json) => {
        const p: ProfileData = json.data;
        setProfile(p);
        setForm({
          name: p.name ?? "",
          phone: p.phone ?? "",
          bank_name: p.bank_name ?? "",
          bank_account_number: "",
          bank_account_holder: p.bank_account_holder ?? "",
        });
      })
      .catch(() => {
        showToast("프로필을 불러오지 못했어요.", "err");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (loading || !focusParam) return;
    const ref = focusParam === "phone" ? phoneRef : bankRef;
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, [loading, focusParam]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, string> = {};
    if (form.name) body.name = form.name;
    if (form.phone) body.phone = form.phone;
    if (form.bank_name) body.bank_name = form.bank_name;
    if (form.bank_account_number) body.bank_account_number = form.bank_account_number;
    if (form.bank_account_holder) body.bank_account_holder = form.bank_account_holder;

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message ?? "저장에 실패했어요.", "err");
        return;
      }
      const p: ProfileData = json.data;
      setProfile(p);
      setForm((prev) => ({
        ...prev,
        bank_account_number: "",
        bank_name: p.bank_name ?? "",
        bank_account_holder: p.bank_account_holder ?? "",
        name: p.name ?? "",
        phone: p.phone ?? "",
      }));
      showToast("저장됐어요.", "ok");
    } catch {
      showToast("잠깐 문제가 있었어요. 다시 시도해주세요.", "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-5 top-16 z-50 flex items-center gap-3 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${
            toast.type === "ok" ? "border-sage" : "border-rust"
          }`}
        >
          {toast.message}
        </div>
      )}

      <header className="mb-8">
        <p className="tracking-overline text-overline uppercase text-ink-mute">설정</p>
        <h1 className="font-display mt-1 text-h1">프로필<span className="text-coral">.</span></h1>
      </header>

      {loading ? (
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded-sm bg-paper-deep" />
              <div className="h-8 w-full rounded-sm bg-paper-deep" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* 기본 정보 */}
          <section>
            <h2 className="mb-5 text-h3 text-ink">기본 정보</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="name">
                  <FieldLabel>이름</FieldLabel>
                  <UnderlineInput
                    id="name"
                    name="name"
                    value={form.name}
                    placeholder="홍길동"
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div>
                <FieldLabel>이메일</FieldLabel>
                <p className="mt-2 py-2 text-body text-ink-soft">{profile?.email}</p>
              </div>

              <div
                ref={phoneRef}
                className={`rounded-md transition-colors duration-500 ${focusParam === "phone" ? "ring-2 ring-coral/40 px-3 py-2 -mx-3 -my-2" : ""}`}
              >
                <label htmlFor="phone">
                  <FieldLabel>연락처</FieldLabel>
                  <UnderlineInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    placeholder="010-0000-0000"
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </section>

          <hr className="border-ink/10" />

          {/* 역할 및 소속 */}
          {(profile?.org_role || (profile?.outreach_memberships?.length ?? 0) > 0 || (profile?.team_memberships?.length ?? 0) > 0) && (
            <>
              <section>
                <h2 className="mb-5 text-h3 text-ink">역할 및 소속</h2>
                <div className="space-y-4">
                  {profile?.org_role && (
                    <div className="flex items-center gap-3 rounded-md border border-ink/10 px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-caption font-medium ${
                        profile.org_role === "OWNER"
                          ? "bg-coral/15 text-coral"
                          : profile.org_role === "ADMIN"
                          ? "bg-mustard/15 text-mustard"
                          : "bg-ink/10 text-ink-soft"
                      }`}>
                        {profile.org_role === "OWNER" ? "교회 OWNER" : profile.org_role === "ADMIN" ? "교회 관리자" : "교회 멤버"}
                      </span>
                      <span className="text-body-sm text-ink-mute">교회 전체 권한</span>
                    </div>
                  )}

                  {profile?.outreach_memberships?.map((om) => (
                    <div key={om.outreach_id} className="flex items-center gap-3 rounded-md border border-ink/10 px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-caption font-medium ${
                        om.role === "DIRECTOR" ? "bg-coral/15 text-coral" : "bg-ocean/15 text-ocean"
                      }`}>
                        {om.role === "DIRECTOR" ? "디렉터" : "사역자"}
                      </span>
                      <div className="text-body-sm">
                        <span className="text-ink">{om.outreach_name}</span>
                        {om.team_name && (
                          <span className="text-ink-mute ml-1">· {om.team_name}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {profile?.team_memberships?.map((tm) => (
                    <Link key={tm.team_id} href={`/teams/${tm.team_id}`}
                      className="flex items-center gap-3 rounded-md border border-ink/10 px-4 py-3 hover:border-ink/30 hover:bg-paper-deep transition-colors">
                      <span className={`flex-shrink-0 rounded px-2 py-0.5 text-caption font-medium ${
                        tm.role === "LEADER" ? "bg-sage/15 text-sage" : "bg-ink/10 text-ink-mute"
                      }`}>
                        {tm.role === "LEADER" ? "팀장" : "팀원"}
                        {tm.is_part_lead && " (파트장)"}
                      </span>
                      <div className="min-w-0 flex-1 text-body-sm">
                        <span className="font-medium text-ink">{tm.team_name}</span>
                        <span className="text-ink-mute ml-1">· {tm.outreach_name}</span>
                        {tm.part && <span className="text-ink-mute ml-1">· {tm.part}</span>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-ink-mute" aria-hidden>
                        <path d="M5.5 3.5L9 7l-3.5 3.5" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
              <hr className="border-ink/10" />
            </>
          )}

          {/* 계좌 정보 */}
          <section
            ref={bankRef}
            className={`rounded-md transition-colors duration-500 ${focusParam === "bank" ? "ring-2 ring-coral/40 px-3 py-2 -mx-3 -my-2" : ""}`}
          >
            <h2 className="mb-1 text-h3 text-ink">계좌 정보</h2>
            <p className="mb-5 text-body-sm text-ink-mute">
              정산 시 사용됩니다. 계좌번호는 암호화 저장돼요.
            </p>

            {profile?.bank_account_number_masked && (
              <div className="mb-5 rounded-md border border-ink/10 bg-paper-deep px-4 py-3">
                <p className="text-caption text-ink-mute">등록된 계좌</p>
                <p className="mt-0.5 font-mono text-body-sm text-ink">
                  {profile.bank_name && <span className="mr-2">{profile.bank_name}</span>}
                  {profile.bank_account_number_masked}
                  {profile.bank_account_holder && (
                    <span className="ml-2 text-ink-soft">({profile.bank_account_holder})</span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="bank_name">
                  <FieldLabel>은행명</FieldLabel>
                </label>
                <input
                  id="bank_name"
                  name="bank_name"
                  type="text"
                  list="bank-list"
                  value={form.bank_name}
                  placeholder="카카오뱅크"
                  onChange={handleChange}
                  className="mt-2 block w-full border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
                />
                <datalist id="bank-list">
                  {["카카오뱅크","토스뱅크","케이뱅크","KB국민은행","신한은행","우리은행","하나은행","NH농협은행","IBK기업은행","SC제일은행","씨티은행","대구은행","부산은행","광주은행","전북은행","경남은행","우체국","새마을금고","신협"].map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="bank_account_number">
                  <FieldLabel>계좌번호</FieldLabel>
                  <UnderlineInput
                    id="bank_account_number"
                    name="bank_account_number"
                    value={form.bank_account_number}
                    placeholder={
                      profile?.bank_account_number_masked
                        ? "새 번호를 입력하면 교체됩니다"
                        : "000-000-000000"
                    }
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div>
                <label htmlFor="bank_account_holder">
                  <FieldLabel>예금주</FieldLabel>
                  <UnderlineInput
                    id="bank_account_holder"
                    name="bank_account_holder"
                    value={form.bank_account_holder}
                    placeholder="홍길동"
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-6 font-medium text-paper transition hover:bg-ink/90 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
