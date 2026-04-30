import Image from "next/image";
import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: string; px: number; text: string }> = {
  sm: { box: "h-8 w-8", px: 32, text: "text-caption" },
  md: { box: "h-10 w-10", px: 40, text: "text-body-sm" },
  lg: { box: "h-14 w-14", px: 56, text: "text-h3" },
};

function initialsOf(name: string): string {
  // 한국어 이름이면 첫 글자 1개, 영문이면 단어별 첫 글자 2개까지.
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const hasHangul = /[가-힣]/.test(trimmed);
  if (hasHangul) return trimmed.slice(0, 1);
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string | null;
  size?: Size;
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const { box, px, text } = sizes[size];
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        "rounded-full border border-ink bg-paper-deep text-ink",
        box,
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={cn("font-display font-semibold", text)}>
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}
