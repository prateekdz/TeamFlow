"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
const Progress = React.forwardRef(({ className, indicatorClassName, value, ...props }, ref) => (<ProgressPrimitive.Root ref={ref} data-slot="progress-root" className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)} {...props}>
    <ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn("h-full w-full flex-1 bg-primary transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]", indicatorClassName)} style={{ transform: `translateX(-${100 - (value || 0)}%)` }}/>
  </ProgressPrimitive.Root>));
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };
