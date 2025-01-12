// /app/components/ArticleHero.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Star } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ArticleHeroProps {
  theme: string
}

const ArticleHero = ({ theme }: ArticleHeroProps) => {
  return (
    <div className="relative">
        {/* 21:9 비율 컨테이너 및 배경 추가 */}
        <div className="aspect-[21/9] overflow-hidden rounded-lg flex bg-gray-100 dark:bg-gray-900 p-10">
            {/* 카드 컨테이너 */}
            <div className="w-1/2 flex items-center justify-center relative h-full">
                <Card className={`bg-blue-500 dark:bg-blue-700 text-white dark:text-gray-100 aspect-square h-full rounded-xl`}>
                    <CardContent className="p-0 h-full flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center">
                                <Star className="w-12 h-12 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* 내용과 슬라이드 컨트롤 컨테이너 */}
            <div className="w-1/2 flex flex-col justify-center p-8">
                <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Article</span>
                    <h2 className="text-2xl font-bold mb-2">
                        2024 시니어 트렌드(2): 액티브 시니어의 여가생활 및 관심사
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        편리하는 시니어 라이프스타일을 확인하세요.
                    </p>
                </div>
                {/* 슬라이드 컨트롤 */}
                <div className="flex items-center mt-4"> {/* justify-between 삭제 */}
                  <div className="flex items-center space-x-2 mr-4"> {/* 슬라이드 표시, 오른쪽 여백 추가 */}
                    {[0, 1, 2, 3, 4].map((dot) => (
                      <button
                        key={dot}
                        className={`w-2 h-2 rounded-full ${dot === 0 ? 'bg-gray-500' : 'bg-gray-500/50 dark:bg-gray-500 dark:bg-opacity-50'}`}
                        aria-label={`Go to slide ${dot + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-4"> {/* 버튼 간격 넓힘 */}
                    <button aria-label="Previous slide">
                      <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button aria-label="Next slide">
                      <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ArticleHero;