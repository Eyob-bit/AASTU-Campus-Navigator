import { cn } from "@/utils/cn";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl", className)} />;
}
