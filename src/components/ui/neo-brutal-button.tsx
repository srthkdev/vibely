import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center font-bold border-3 border-black shadow-brutal transition-all duration-150 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        primary: "bg-yellow-400 hover:bg-yellow-300",
        secondary: "bg-pink-400 hover:bg-pink-300",
        success: "bg-green-400 hover:bg-green-300",
        danger: "bg-red-400 hover:bg-red-300",
        info: "bg-blue-400 hover:bg-blue-300",
      },
      size: {
        sm: "text-sm py-1 px-2",
        md: "text-base py-2 px-4",
        lg: "text-lg py-3 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface NeoBrutalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const NeoBrutalButton = React.forwardRef<HTMLButtonElement, NeoBrutalButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoBrutalButton.displayName = "NeoBrutalButton"

export { NeoBrutalButton, buttonVariants }