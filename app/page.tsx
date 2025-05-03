import Header from './components/Header';
import Categories from './components/Categories';
import DarkModeToggle from './components/DarkModeToggle';
import FeaturedPosts from './components/FeaturedPosts';
import AdditionalPosts from './components/AdditionalPosts';
import Footer from './components/Footer';
import { PostOrPage, Tag } from "@tryghost/content-api";

interface TagWithSlug extends Tag {
    slug: string;
}
interface PostWithTags extends PostOrPage {
    tags?: TagWithSlug[];
}

async function getFeaturedPosts(): Promise<PostWithTags[]> {
  try {
    const res = await fetch(`${process.env.APP_URL}/api/posts/browse?limit=3&include=tags,authors&order=published_at%20DESC&filter=tags:[main]`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch featured posts: ${res.status}`);
    const data = await res.json();
    return data.map((post: PostOrPage) => ({
        ...post,
         tags: post.tags?.map((tag: Tag) => ({ ...tag, slug: tag.slug }))
      }));
  } catch (error) {
    console.error("Error in getFeaturedPosts:", error);
    return [];
  }
}

async function getAdditionalPosts(): Promise<PostWithTags[]> {
   try {
    const res = await fetch(`${process.env.APP_URL}/api/posts/browse?limit=6&include=tags,authors`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch additional posts: ${res.status}`);
    const data = await res.json();
     const postsWithTags = data.map((post: PostOrPage) => ({
        ...post,
        tags: post.tags?.map((tag: Tag) => ({ ...tag, slug: tag.slug }))
      }));
     return postsWithTags.filter((post: PostWithTags) => !post.tags?.some((tag: Tag) => tag.slug === 'article'));
  } catch (error) {
    console.error("Error in getAdditionalPosts:", error);
    return [];
  }
}

async function getCategoriesTags(): Promise<Tag[]> {
  try {
    const res = await fetch(`${process.env.APP_URL}/api/tags/browse?limit=all`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
    const data = await res.json();
    return data.filter((tag: Tag) =>
      ['coding', 'ai', 'graphic'].includes(tag.slug)
    );
  } catch (error) {
    console.error("Error in getCategoriesTags:", error);
    return [];
  }
}

export default async function Home() {
  const [featuredPostsData, additionalPostsData, categoriesTagsData] = await Promise.all([
    getFeaturedPosts(),
    getAdditionalPosts(),
    getCategoriesTags()
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-full md:max-w-[70%] mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Categories tags={categoriesTagsData} />
            <DarkModeToggle />
          </div>
          <FeaturedPosts featuredPosts={featuredPostsData} />
          <AdditionalPosts posts={additionalPostsData} />
        </div>
      </main>
      <Footer />
    </div>
  );
}