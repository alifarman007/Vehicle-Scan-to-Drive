"use client"

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Light-only toasts at the top, clear of the notch and the bottom action bar. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)", left: 12, right: 12 }}
      visibleToasts={3}
      gap={8}
      icons={{
        success: <CircleCheck className="size-5 text-success" />,
        info: <Info className="size-5 text-muted-foreground" />,
        warning: <TriangleAlert className="size-5 text-warning" />,
        error: <CircleAlert className="size-5 text-destructive" />,
        loading: <LoaderCircle className="size-5 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
          "--width": "400px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!gap-3 !px-4 !py-3.5 !shadow-float !text-[15px] !font-medium",
          description: "!text-[14px] !text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
