import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border-3 border-black px-5 py-4 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current shadow-cartoon-sm font-bold",
  {
    variants: {
      variant: {
        default: "bg-white text-card-foreground",
        destructive: "text-destructive bg-red-50 [&>svg]:text-current",
        success: "bg-green-50 text-green-900 [&>svg]:text-green-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({ className, variant, ...props }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props} />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-5 font-black tracking-tight", className)}
      {...props} />
  );
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm font-bold",
        className
      )}
      {...props} />
  );
}

export { Alert, AlertTitle, AlertDescription }
