import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-3 border-black shadow-cartoon-sm hover:translate-y-[-2px] hover:shadow-cartoon active:translate-y-[0px] active:shadow-cartoon-sm",
  {
    variants: {
      variant: {
        default: "bg-[#f582ae] text-white hover:bg-[#ff69b4]",
        destructive: "bg-destructive text-white hover:bg-red-600",
        outline: "bg-white text-foreground hover:bg-[#f3d2c1]",
        secondary: "bg-[#8bd3dd] text-foreground hover:bg-[#7bc4ce]",
        ghost: "border-transparent shadow-none hover:bg-[#f3d2c1] hover:border-black hover:shadow-cartoon-sm",
        success: "bg-[#ffc13b] text-foreground hover:bg-[#ffb700]",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 rounded-xl px-6 has-[>svg]:px-5",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
