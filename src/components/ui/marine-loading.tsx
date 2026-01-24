import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Waves, Ship } from "lucide-react";

interface MarineSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MarineSpinner({ size = "md", className }: MarineSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("animate-spin text-primary", sizeClasses[size])}>
        <Anchor className="w-full h-full" />
      </div>
      <div className="absolute -bottom-2 animate-pulse">
        <Waves className="w-4 h-4 text-primary/50" />
      </div>
    </div>
  );
}

interface MarineLoadingScreenProps {
  message?: string;
  className?: string;
}

export function MarineLoadingScreen({ message = "Setting sail...", className }: MarineLoadingScreenProps) {
  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center bg-background", className)}>
      <div className="relative">
        <Ship className="w-16 h-16 text-primary animate-bounce" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
      <p className="mt-8 text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  );
}

// Card skeleton for work orders and reservations
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

// Grid skeleton for dashboard cards
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      
      {/* Cards */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// Map skeleton
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-muted", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <MarineSpinner size="lg" />
      </div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary/50 animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "100ms" }} />
        <div className="absolute bottom-1/4 left-1/3 w-5 h-5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "200ms" }} />
        <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// Boat log timeline skeleton
export function TimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            {i < count - 1 && <Skeleton className="w-0.5 flex-1 mt-2" />}
          </div>
          <div className="flex-1 pb-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List skeleton
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}