import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { teamId } = await params;

  const res = await fetch(
    `${API_BASE}/api/v1/teams/${teamId}/expenses/reports/expenses.xlsx`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ message: data.detail ?? "다운로드에 실패했습니다." }, { status: res.status });
  }

  const blob = await res.arrayBuffer();
  const contentDisposition = res.headers.get("Content-Disposition") ?? 'attachment; filename="expenses.xlsx"';

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition,
    },
  });
}
