import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type Variant = "underline" | "boxed";

const variants: Record<Variant, string> = {
  // 편지지 느낌의 밑줄 입력 (기본)
  underline:
    "bg-paper border-b-2 border-ink/30 px-0 py-2 " +
    "focus:border-ink focus:outline-none placeholder:text-ink-mute",
  // 검색바, 모달 등
  boxed:
    "bg-paper border border-ink/30 rounded-md px-3 py-2 " +
    "focus:border-ink focus:outline-none placeholder:text-ink-mute",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  errorText?: ReactNode;
  variant?: Variant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    errorText,
    variant = "underline",
    id,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = errorText ? `${inputId}-error` : undefined;

  return (
    <div className="block">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-caption font-semibold tracking-wide uppercase text-ink-soft"
        >
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={errorText ? true : undefined}
        className={cn(
          label ? "mt-2" : undefined,
          "block w-full text-body",
          variants[variant],
          errorText && "border-rust focus:border-rust",
          className,
        )}
        {...props}
      />
      {hint && !errorText ? (
        <p id={hintId} className="mt-1 text-caption text-ink-mute">
          {hint}
        </p>
      ) : null}
      {errorText ? (
        <p id={errorId} className="mt-1 text-caption text-rust">
          {errorText}
        </p>
      ) : null}
    </div>
  );
});
