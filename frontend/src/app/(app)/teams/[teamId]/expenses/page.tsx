import Link from "next/link";
import { auth } from "@/auth";
import { fetchApi } from "@/lib/api";
import type { ExpenseCategory, ExpensePublic, ExpenseStatus } from "@/types/api";

// ── 레이블 / 스타일 ─────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통",
  LODGING: "숙박",
  MEAL: "식사",
  MINISTRY: "사역",
  GIFT: "선물",
  SUPPLIES: "물품",
  MEDICAL: "의료",
  MISC: "기타",
};

const STATUS_CONFIG: Record<
  ExpenseStatus,
  { label: string; style: string }
> = {
  pending: { label: "검토 대기", style: "bg-mustard/15 text-mustard" },
  approved: { label: "승인됨", style: "bg-sage/15 text-sage" },
  rejected: { label: "반려됨", style: "bg-rust/15 text-rust" },
  reimbursed: { label: "정산 완료", style: "bg-ink-mute/15 text-ink-mute" },
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function formatKRW(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function ExpenseRow({ expense }: { expense: ExpensePublic }) {
  const status = STATUS_CONFIG[expense.status];
  return (
    <li className="flex items-start gap-4 rounded-md border border-ink/10 bg-paper p-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <span className="font-medium text-ink">{expense.description}</span>
          <span className="flex-shrink-0 rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">
            {CATEGORY_LABEL[expense.category]}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-ink-mute">
          <span>{formatDate(expense.spent_at)}</span>
          {expense.vendor && <span>{expense.vendor}</span>}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <span className="font-medium text-ink">
          {formatKRW(expense.amount, expense.currency)}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-caption ${status.style}`}>
          {status.label}
        </span>
      </div>
    </li>
  );
}

function Summary({
  expenses,
}: {
  expenses: ExpensePublic[];
}) {
  const krwExpenses = expenses.filter((e) => e.currency === "KRW");
  const total = krwExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const pending = krwExpenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + parseFloat(e.amount), 0);
  const approved = krwExpenses
    .filter((e) => e.status === "approved" || e.status === "reimbursed")
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <KpiMini label="전체" value={formatKRW(total.toString(), "KRW")} />
      <KpiMini label="검토 대기" value={formatKRW(pending.toString(), "KRW")} />
      <KpiMini label="승인됨" value={formatKRW(approved.toString(), "KRW")} />
    </div>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper px-4 py-3">
      <p className="text-caption text-ink-mute">{label}</p>
      <p className="mt-1 text-body-sm font-medium text-ink">{value}</p>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function ExpensesPage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  const expenses = await fetchApi<ExpensePublic[]>(
    `/teams/${teamId}/expenses`,
    session.accessToken,
  );

  // 최신 순 정렬
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime(),
  );

  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">지출</h1>
        </div>
        <Link
          href={`/teams/${teamId}/expenses/new`}
          className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:bg-ink-soft"
        >
          + 등록
        </Link>
      </header>

      {expenses.length > 0 && <Summary expenses={expenses} />}

      {expenses.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-mute">등록된 지출이 없습니다.</p>
          <Link
            href={`/teams/${teamId}/expenses/new`}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:bg-ink-soft"
          >
            첫 지출 등록하기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </ul>
      )}
    </div>
  );
}
