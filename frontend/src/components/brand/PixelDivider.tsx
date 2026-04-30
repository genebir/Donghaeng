import { cn } from "@/lib/cn";

/**
 * DESIGN.md §4-B: 1px 라인 디바이더 대신 사용하는 픽셀 점선.
 * 가로로 작은 정사각형 픽셀이 일정 간격 + 끝부분에 약간 강조.
 * 색은 currentColor — 컨텍스트(midnight=ci-gray, paper=ink-soft)에 맞춰 사용.
 */

const COUNT = 32;
const CELL = 8; // 8px 그리드 기준
const DOT = 2;

export function PixelDivider({ className }: { className?: string }) {
  const width = COUNT * CELL;
  return (
    <svg
      viewBox={`0 0 ${width} ${CELL}`}
      preserveAspectRatio="xMinYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-2 w-full", className)}
      aria-hidden="true"
    >
      <g fill="currentColor">
        {Array.from({ length: COUNT }).map((_, i) => (
          <rect
            key={i}
            x={i * CELL + (CELL - DOT) / 2}
            y={(CELL - DOT) / 2}
            width={DOT}
            height={DOT}
          />
        ))}
      </g>
    </svg>
  );
}
