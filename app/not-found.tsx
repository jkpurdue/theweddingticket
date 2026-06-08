import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="font-serif text-[120px] leading-none tracking-[-8px] text-primary/10">404</div>
      <h1 className="font-serif text-4xl tracking-tight -mt-8 mb-3">Page not found</h1>
      <p className="text-muted-foreground max-w-xs mb-8">The page you’re looking for doesn’t exist or may have moved.</p>
      <Button variant="elegant" asChild>
        <Link href="/">Return to homepage</Link>
      </Button>
    </div>
  );
}
