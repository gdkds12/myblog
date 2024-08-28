"use client";
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-6 flex items-center justify-center"> {/* 내용을 중앙에 배치 */}
        <div className="max-w-full md:max-w-[80%] mx-auto px-4 text-center"> {/* 텍스트 중앙 정렬 */}
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">현재 개발 중입니다</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            더 나은 서비스를 위해 열심히 개발 중입니다. 조금만 기다려 주세요!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
