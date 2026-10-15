import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-zinc-50 shadow-sm hover:bg-zinc-800 active:scale-[0.98]",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        outline:
          "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98]",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:scale-[0.98]",
        ghost:
          "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
        link:
          "text-zinc-900 underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 text-sm",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
