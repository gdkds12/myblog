// app/components/Footer.tsx
import { Button } from "@/components/ui/button";
import { Rss } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <p>&copy; 2024 CodeprismX.</p>
        <Button variant="ghost" size="icon">
          <Rss className="h-4 w-4" />
          <span className="sr-only">RSS feed</span>
        </Button>
      </div>
    </footer>
  );
}
