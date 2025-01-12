// /app/components/ArticleGrid.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Star, Activity, Play } from 'lucide-react';

interface ArticleGridProps {
  theme: string
}

const ArticleGrid = ({ theme }: ArticleGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`bg-blue-500 dark:bg-blue-700 text-white dark:text-gray-100 aspect-video`}>
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs mb-2">Article</p>
              <h3 className="text-lg font-semibold mb-2">2024 시니어 트렌드(2): 액티브 시니어의 여가생활 및 관심사</h3>
              <p className="text-white dark:text-gray-100 text-sm mb-2">편리하는 시니어 라이프스타일을 확인하세요.</p>
              {/* 날짜 표시 제거 */}
            </CardContent>
          </Card>

          <Card className={`bg-purple-500 dark:bg-purple-700 text-white dark:text-gray-100 aspect-video`}>
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs mb-2">Article</p>
              <h3 className="text-lg font-semibold mb-2">2024 시니어 트렌드(1): 시니어의 노후 준비와 건강 관리</h3>
              <p className="text-white dark:text-gray-100 text-sm mb-2">시니어의 니즈를 파악하고 새로운 비즈니스 기회를 발굴하세요.</p>
              {/* 날짜 표시 제거 */}
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br from-blue-400 to-blue-100 dark:from-blue-600 dark:to-blue-800 text-blue-900 dark:text-white aspect-video`}>
            <CardContent className="p-6">
              <div className="mb-4 w-12 h-12 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center">
                <Play className={`w-6 h-6 text-blue-900 dark:text-white`} />
              </div>
              <p className="text-xs mb-2">Article</p>
              <h3 className="text-lg font-semibold mb-2">2024 콘텐츠 트렌드: 웰푼은 중고 피코믹은 유행하는 이유</h3>
              <p className="text-sm mb-2">지금 소비자가 좋아는 콘텐츠는 무엇일까요?</p>
              {/* 날짜 표시 제거 */}
            </CardContent>
          </Card>
        </div>
    );
};

export default ArticleGrid;