import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const search = req.nextUrl.searchParams.toString();
  const res = await fetch(
    `${API_BASE}/api/v1/teams/${teamId}/members${search ? `?${search}` : ""}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ message: data.detail ?? "오류" }, { status: res.status });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/v1/teams/${teamId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ message: data.detail ?? "추가 실패" }, { status: res.status });
  return NextResponse.json(data, { status: 201 });
}
