// app/articles/page.tsx
import ArticlePageClient from "./ArticlePageClient";
import { getPosts } from "@/lib/strapi";
import type { PostOrPage } from "@/lib/types";

export const revalidate = 60 * 60 * 24 * 7; // cache for 7 days

export default async function ArticlePage() {
  const posts: PostOrPage[] = await getPosts({ limit: 20 });
  const articlePosts = posts.filter((p) => (p.tags ?? []).some((t) => t.slug === "article"));
  const featuredPosts = articlePosts.slice(0, 5);

  return <ArticlePageClient featuredPosts={featuredPosts} articlePosts={articlePosts.slice(0, 12)} />;

}