import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--color-muted)] disabled:text-white disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] shadow-sm",
        secondary:
          "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-600)] active:bg-[var(--color-secondary-700)] shadow-sm",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-ink-deep)] hover:bg-[var(--color-accent-500)] active:bg-[var(--color-accent-600)] shadow-sm",
        outline:
          "border border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary-50)] active:bg-[var(--color-primary-100)]",
        ghost:
          "text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary-50)] active:bg-[var(--color-primary-100)]",
      },
      size: {
        lg: "h-12 px-8 text-[18px]",
        md: "h-10 px-4 py-2 text-[16px]",
        sm: "h-8 px-3 text-[14px]",
        icon: "h-10 w-10 flex-shrink-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
