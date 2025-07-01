import Header from './components/Header';
import Categories from './components/Categories';
import DarkModeToggle from './components/DarkModeToggle';
import FeaturedPosts from './components/FeaturedPosts';
import AdditionalPosts from './components/AdditionalPosts';
import Footer from './components/Footer';
import { getPosts, getTags } from '@/lib/strapi';

export default async function Home() {
  // 1. fetch posts & tags in parallel
  const [posts, tags] = await Promise.all([
    getPosts({ start: 0, limit: 20 }), // 가져올 만큼 넉넉히
    getTags('all'),
  ]);

  // 2. Featured: 태그(main) 포함 상위 3개
  const featuredPosts = posts.slice(0, 3);

  // 3. Additional: article 태그를 제외한 상위 6개
  const additionalPosts = posts.slice(3, 9);

  // 4. 카테고리용 태그 필터
  const categoryTags = tags.filter((t: any) =>
    ['coding', 'ai', 'graphic'].includes(t.slug)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-full md:max-w-[70%] mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Categories tags={categoryTags} />
            <DarkModeToggle />
          </div>
          <FeaturedPosts featuredPosts={featuredPosts} />
          <AdditionalPosts posts={additionalPosts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}