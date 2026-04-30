import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-h2",
  md: "text-display-md",
  lg: "text-display-lg",
  xl: "text-display-xl",
};

export interface WordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
}

/**
 * "동행." 워드마크. DESIGN.md §4-B 정의대로 Gowun Batang/Fraunces 디스플레이 페어링,
 * 마침표만 코럴 액센트 (CI 빨강과 호응).
 */
export function Wordmark({ size = "md", className, ...props }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display font-semibold tracking-tight",
        sizes[size],
        className,
      )}
      {...props}
    >
      동행<span className="text-coral">.</span>
    </span>
  );
}
