// app/components/Footer.tsx
import { Button } from "@/components/ui/button";
import { Rss } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pt-12 pb-6 border-t">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <p>© 2024 Greedient.</p>
        <div className="flex items-center space-x-4">
        <a href="mailto:gdkds12@gmail.com" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            gdkds12@gmail.com
          </a>
          <Button variant="ghost" size="icon">
            <Rss className="h-4 w-4" />
            <span className="sr-only">RSS feed</span>
          </Button>
          </div>
      </div>
    </footer>
  );
}