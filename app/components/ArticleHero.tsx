// /app/components/ArticleHero.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Star } from 'lucide-react';

interface ArticleHeroProps {
  theme: string
}

const ArticleHero = ({ theme }: ArticleHeroProps) => {
  return (
    <div className="relative">
        <div className="overflow-hidden rounded-lg">
            <Card className={`bg-blue-500 dark:bg-blue-700 text-white dark:text-gray-100`}>
                <CardContent className="p-8">
                    <div className="mb-6 w-16 h-16 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center">
                        <Star className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        2024 시니어 트렌드(2): 액티브 시니어의 여가생활 및 관심사
                    </h2>
                    <p className="text-white dark:text-gray-100 mb-4">
                        편리하는 시니어 라이프스타일을 확인하세요.
                    </p>
                    <p className="text-gray-200 dark:text-gray-300 text-sm">2024-12-31</p>
                </CardContent>
            </Card>
        </div>

    {/* Carousel Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
            {[0, 1, 2, 3, 4].map((dot) => (
                <button
                    key={dot}
                    className={`w-2 h-2 rounded-full ${dot === 0 ? 'bg-white' : 'bg-white/50 dark:bg-gray-500 dark:bg-opacity-50'}`}
                    aria-label={`Go to slide ${dot + 1}`}
                />
            ))}
        </div>
  </div>
  );
};

export default ArticleHero;