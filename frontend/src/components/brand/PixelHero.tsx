import { cn } from "@/lib/cn";

/**
 * 랜딩 히어로 배경 픽셀 패턴.
 * DESIGN.md §4-B: 8px 그리드, sparse 패턴 + 코럴 픽셀 십자가 정확히 1개.
 * 위치는 우리들교회 CI의 "우리들" 픽셀 분위기를 환기.
 */

// 8px 단위, 256x256 viewBox.
// 좌상단/우상단/우하단 코너에 sparse 클러스터 + 중앙에 코럴 십자가.
const grayPixels: ReadonlyArray<readonly [number, number]> = [
  // 좌상단 클러스터 ("우" 어림)
  [0, 32],
  [16, 32],
  [0, 48],
  [24, 48],
  [40, 56],
  [8, 64],
  // 상단 산포
  [80, 24],
  [96, 24],
  [88, 40],
  [200, 16],
  [216, 16],
  [232, 32],
  // 우상단
  [232, 56],
  [216, 64],
  [240, 72],
  // 중앙 산포 (십자가 주변은 비워둠)
  [56, 80],
  [72, 96],
  [56, 112],
  [184, 96],
  [200, 88],
  [192, 112],
  // 좌하단
  [16, 200],
  [0, 216],
  [24, 224],
  [40, 224],
  [16, 232],
  [56, 240],
  // 하단 산포
  [104, 224],
  [144, 232],
  [176, 216],
  // 우하단
  [200, 192],
  [216, 208],
  [232, 224],
];

export function PixelHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <g fill="var(--ci-gray)" fillOpacity="0.45">
        {grayPixels.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" />
        ))}
      </g>
      {/* 시선의 정점 — 코럴 픽셀 십자가 1개 (DESIGN.md: 한 화면 최대 1개). */}
      <g fill="var(--coral)">
        <rect x="120" y="104" width="8" height="40" />
        <rect x="104" y="120" width="40" height="8" />
      </g>
    </svg>
  );
}
