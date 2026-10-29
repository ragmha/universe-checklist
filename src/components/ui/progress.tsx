import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const progress = value ?? 0;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-primary/25", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary-foreground transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
