import * as React from "react"
import { cn } from "../../lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-12 w-full min-w-0 rounded-xl border-3 border-black bg-white px-4 py-3 text-sm shadow-cartoon-sm transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 font-bold",
        "focus-visible:shadow-cartoon focus-visible:translate-y-[-2px]",
        "aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
