import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Tone = "default" | "in_progress" | "done" | "danger" | "info";

const tones: Record<Tone, string> = {
  default: "border-ink text-ink",
  in_progress: "border-mustard text-mustard",
  done: "border-sage text-sage",
  danger: "border-rust text-rust",
  info: "border-ocean text-ocean",
};

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Tag({ tone = "default", className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5",
        "text-caption font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
