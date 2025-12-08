"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
}

export function Loader({ 
  className, 
  size = "md", 
  text,
  variant = "dots"
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div className="flex items-center gap-1.5">
          <div 
            className={cn(
              "rounded-full bg-primary/70",
              sizeClasses[size]
            )}
            style={{
              animation: "loader-dot 1.4s ease-in-out infinite",
              animationDelay: "0ms"
            }}
          />
          <div 
            className={cn(
              "rounded-full bg-primary/70",
              sizeClasses[size]
            )}
            style={{
              animation: "loader-dot 1.4s ease-in-out infinite",
              animationDelay: "200ms"
            }}
          />
          <div 
            className={cn(
              "rounded-full bg-primary/70",
              sizeClasses[size]
            )}
            style={{
              animation: "loader-dot 1.4s ease-in-out infinite",
              animationDelay: "400ms"
            }}
          />
        </div>
        {text && (
          <p className="text-sm text-muted-foreground font-medium">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div 
          className={cn(
            "rounded-full bg-primary/20 animate-ping",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground font-medium">{text}</p>
        )}
      </div>
    );
  }

  // Spinner variant (default)
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div 
          className={cn(
            "border-2 border-primary/20 rounded-full",
            sizeClasses[size]
          )}
        />
        <div 
          className={cn(
            "border-2 border-transparent border-t-primary rounded-full animate-spin absolute inset-0",
            sizeClasses[size]
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground font-medium">{text}</p>
      )}
    </div>
  );
}

