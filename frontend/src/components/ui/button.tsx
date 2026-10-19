import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E76552] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#E76552] hover:bg-[#D8523E] text-white shadow-coral-soft active:scale-[0.98]",
        destructive:
          "bg-red-600 dark:bg-red-600 text-white shadow-xs hover:bg-red-700 active:scale-[0.98]",
        outline:
          "border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] shadow-subtle hover:bg-[#F5F4F7] dark:hover:bg-[#282534] hover:border-[#D8D4DE] dark:hover:border-[#3E3A4D] active:scale-[0.98]",
        secondary:
          "bg-[#F0EFF4] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#EAE7ED] dark:hover:bg-[#282534] active:scale-[0.98]",
        ghost:
          "text-[#85818D] dark:text-[#A5A0AF] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] hover:text-[#25232B] dark:hover:text-[#F2F1F6]",
        link:
          "text-[#25232B] dark:text-[#F2F1F6] underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-600 dark:bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98]",
        coral:
          "bg-[#E76552] text-white shadow-coral-soft hover:bg-[#D8523E] active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7.5 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-6 text-sm",
        pill: "h-8.5 rounded-full px-4 text-xs font-medium",
        icon: "h-8.5 w-8.5 rounded-full p-0",
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
