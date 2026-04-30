import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "동행 — 함께 걷는다",
  description:
    "교회 단기선교/아웃리치 팀이 기획부터 회고까지 한 곳에서 진행할 수 있는 플랫폼.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
