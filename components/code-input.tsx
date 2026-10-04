"use client"

import { cn } from "cn"
import type * as React from "react"

import { Input } from "@/components/ui/input"
import { formatCodeInput, hasLookalikes, normalizeCode } from "@/lib/codes"
import { strings } from "@/lib/strings"

/** Checks typed code text. Returns the code, or a friendly error. */
export function validateCodeInput(value: string): { code: string } | { error: string } {
  const code = normalizeCode(value)
  if (code) return { code }
  if (hasLookalikes(value)) return { error: strings.codeInput.lookalikes }
  return { error: strings.codeInput.incomplete }
}

/** One big mono field that formats as you type: k7m2qx → K7M-2QX. */
export function CodeInput({
  value,
  onValueChange,
  invalid,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onValueChange(formatCodeInput(e.target.value))}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="go"
      maxLength={7}
      placeholder={strings.codeInput.placeholder}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-16 pl-[calc(1rem+0.3em)] text-center font-mono text-[28px] font-semibold tracking-[0.3em] uppercase placeholder:text-rule",
        invalid && "animate-shake",
        className
      )}
      {...props}
    />
  )
}
