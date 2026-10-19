import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#E76552]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#E76552] text-white shadow-xs",
        secondary:
          "border-[#EAE7ED] dark:border-[#282534] bg-[#F4F3F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]",
        destructive:
          "border-red-200 dark:border-red-950/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
        outline:
          "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6]",
        success:
          "border-emerald-200 dark:border-emerald-950/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300",
        warning:
          "border-amber-200 dark:border-amber-950/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300",
        info:
          "border-sky-200 dark:border-sky-950/60 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300",
        purple:
          "border-purple-200 dark:border-purple-950/60 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300",
        accent:
          "border-[#F7C6BF] dark:border-[#E76552]/40 bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#D8523E] dark:text-[#F7A89B]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
