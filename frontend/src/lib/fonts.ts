import { Gowun_Batang } from "next/font/google";
import localFont from "next/font/local";

/**
 * 디자인 토큰과 페어링되는 폰트 패밀리 변수.
 * globals.css에서 --font-display / --font-body가 이 변수들을 fallback chain으로 참조한다.
 */

export const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});

export const inter = localFont({
  src: [
    {
      path: "../../public/fonts/InterVariable.woff2",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../../public/fonts/InterVariable-Italic.woff2",
      style: "italic",
      weight: "100 900",
    },
  ],
  display: "swap",
  variable: "--font-inter",
});

export const fraunces = localFont({
  src: "../../public/fonts/Fraunces-Variable.ttf",
  display: "swap",
  weight: "100 900",
  variable: "--font-fraunces",
});

// Gowun Batang은 한글 글리프가 무거워 (TTF 8 MB × 2) 저장소에 두지 않고
// next/font/google로 빌드 타임에 자동 자가호스팅한다.
export const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun-batang",
  // korean glyphs는 unicode-range로 자동 분할 — preload는 latin만.
  preload: true,
});

export const fontVariables = [
  pretendard.variable,
  inter.variable,
  fraunces.variable,
  gowunBatang.variable,
].join(" ");
