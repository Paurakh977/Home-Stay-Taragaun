"use client";

import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loader({ className, ...props }: LoaderProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-t-2 border-b-2 border-primary", className)}
      {...props}
    />
  );
} 