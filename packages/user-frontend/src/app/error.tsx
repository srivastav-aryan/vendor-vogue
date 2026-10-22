"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an error monitoring service
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred while rendering this page.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
      </div>
    </div>
  );
}
