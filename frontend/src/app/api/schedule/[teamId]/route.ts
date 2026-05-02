import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuth() {
  const session = await auth();
  if (!session) return null;
  return session.accessToken;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const token = await getAuth();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const { searchParams } = req.nextUrl;
  const query = searchParams.toString();
  const res = await fetch(`${API_BASE}/api/v1/teams/${teamId}/schedule${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const token = await getAuth();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/v1/teams/${teamId}/schedule`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
