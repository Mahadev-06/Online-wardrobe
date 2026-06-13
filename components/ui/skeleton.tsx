import * as React from "react";
import { cn } from "../../utils/cn";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-white/5 animate-pulse rounded-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
