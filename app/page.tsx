import BlogHome from './components/BlogHome';
import type { Tag } from '@/lib/types';
import Footer from './components/Footer';
import { getPosts, getTags } from '@/lib/strapi';

export default async function Home() {
  // 1. fetch posts & tags in parallel
  const [allPosts, tags] = await Promise.all([
    getPosts({ start: 0, limit: 20 }), // 가져올 만큼 넉넉히
    getTags('all'),
  ]);


    // 4. 카테고리: 우선 Strapi에서 가져온 태그(또는 카테고리)를 사용하고,
  // 비어 있으면 포스트에 포함된 태그를 추출해 대체합니다.
  // 블로그 메인에서는 'article' 태그가 붙은 글을 제외합니다.
  const posts = allPosts.filter((post: any) => !(post.tags?.some((t: any) => t.slug === 'article')));

  // 카테고리에서 'article'과 'blog' 태그를 제외합니다.
  let categoryTags: Tag[] = tags.filter((t: Tag) => t.slug !== 'article' && t.slug !== 'main');
  if (categoryTags.length === 0) {
    const tagMap = new Map<string, Tag>();
    posts.forEach((post: any) => {
      (post.tags ?? []).forEach((tag: any) => {
        if (tag && tag.slug) {
          tagMap.set(tag.slug, tag as Tag);
        }
      });
    });
    categoryTags = Array.from(tagMap.values()).filter((t) => t.name);
  }

  return (
    <div className="min-h-screen flex flex-col">
            <main className="flex-grow py-6">
        <div className="max-w-full md:max-w-[70%] mx-auto px-4">
          <BlogHome posts={posts} tags={categoryTags} />
        </div>
      </main>
      <Footer />
    </div>
  );
}