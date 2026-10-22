import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-4xl font-bold tracking-tight">404 - Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Button asChild variant="default">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
