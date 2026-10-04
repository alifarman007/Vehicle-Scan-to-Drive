"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function PrintButton() {
  return (
    <Button size="xl" onClick={() => window.print()}>
      <Printer />
      {strings.myQr.print}
    </Button>
  )
}
