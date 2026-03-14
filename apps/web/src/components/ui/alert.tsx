import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0fr_1fr] items-start gap-y-0.5 rounded-lg border p-4 text-sm has-[>svg]:grid-cols-[1.25rem_1fr] has-[>svg]:gap-x-3 has-data-[slot=alert-action]:grid-cols-[0fr_1fr_auto] has-data-[slot=alert-action]:has-[>svg]:grid-cols-[1.25rem_1fr_auto] [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current [&>svg~*]:col-start-2",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground [&>svg]:text-muted-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive [&>svg]:text-destructive",
        warning:
          "border-warning/30 bg-warning/5 text-warning [&>svg]:text-warning",
        caution:
          "border-caution/30 bg-caution/5 text-caution [&>svg]:text-caution",
        info:
          "border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary",
        success:
          "border-safe/30 bg-safe/5 text-safe [&>svg]:text-safe",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 text-sm font-semibold leading-snug", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 mt-0.5 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("col-start-3 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }
