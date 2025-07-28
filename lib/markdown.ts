// lib/markdown.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import readingTime from 'reading-time';
import { PostOrPage, Tag, Author } from './types';
import { optimizeMarkdownImages } from './gcs';

// 마크다운 파일이 저장될 디렉토리
const POSTS_DIRECTORY = path.join(process.cwd(), 'content', 'posts');
const PAGES_DIRECTORY = path.join(process.cwd(), 'content', 'pages');

// 마크다운 frontmatter 인터페이스
interface PostFrontmatter {
  title: string;
  slug: string;
  excerpt?: string;
  feature_image?: string;
  published_at: string;
  tags?: string[];
  author?: string;
  authors?: string[];
  draft?: boolean;
}

// 디렉토리가 존재하는지 확인하고 없으면 생성
function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 마크다운 파일에서 포스트 데이터 추출
export function parseMarkdownFile(filePath: string): PostOrPage | null {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const frontmatter = data as PostFrontmatter;

    // draft 파일은 production에서 제외
    if (frontmatter.draft && process.env.NODE_ENV === 'production') {
      return null;
    }

    // 이미지 URL 최적화 적용
    const optimizedContent = optimizeMarkdownImages(content);

    // remark를 사용한 향상된 마크다운 처리
    const processedContent = remark()
      .use(remarkGfm) // GitHub Flavored Markdown 지원
      .use(remarkHtml, { sanitize: false }) // HTML 출력
      .processSync(optimizedContent);

    const html = processedContent.toString();

    // 읽기 시간 계산
    const readingTimeStats = readingTime(content);

    // 태그 처리
    const tags: Tag[] = (frontmatter.tags || []).map((tagName, index) => ({
      id: index + 1,
      name: tagName,
      slug: tagName.toLowerCase().replace(/\s+/g, '-'),
    }));

    // 작성자 처리
    const primary_author: Author | null = frontmatter.author ? {
      id: 1,
      name: frontmatter.author,
      slug: frontmatter.author.toLowerCase().replace(/\s+/g, '-'),
    } : null;

    const authors: Author[] = (frontmatter.authors || [frontmatter.author]).filter(Boolean).map((authorName, index) => ({
      id: index + 1,
      name: authorName,
      slug: authorName!.toLowerCase().replace(/\s+/g, '-'),
    }));

    // 목차 생성 (임시로 비활성화)
    // const toc = extractTableOfContents(content);

    return {
      id: frontmatter.slug,
      slug: frontmatter.slug,
      title: frontmatter.title,
      html,
      feature_image: frontmatter.feature_image || null,
      excerpt: frontmatter.excerpt || extractExcerpt(content),
      tags,
      published_at: frontmatter.published_at,
      primary_author,
      authors: authors.length > 0 ? authors : undefined,
      reading_time: readingTimeStats.text,
      word_count: readingTimeStats.words,
      // toc, // 목차 추가 (임시로 비활성화)
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return null;
  }
}

// 콘텐츠에서 발췌문 추출
function extractExcerpt(content: string, maxLength: number = 160): string {
  // 마크다운 문법 제거하고 첫 문단 추출
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // 헤딩 제거
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold 제거
    .replace(/\*(.*?)\*/g, '$1') // italic 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크 제거
    .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
    .replace(/`(.*?)`/g, '$1') // 인라인 코드 제거
    .split('\n')[0]; // 첫 번째 줄만

  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
}

// 목차 추출
function extractTableOfContents(content: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    toc.push({ id, text, level });
  }

  return toc;
}

// 모든 포스트 가져오기
export async function getPosts({ start = 0, limit = 10 } = {}): Promise<PostOrPage[]> {
  ensureDirectoryExists(POSTS_DIRECTORY);

  try {
    const filenames = fs.readdirSync(POSTS_DIRECTORY)
      .filter(name => name.endsWith('.md') || name.endsWith('.mdx'));

    const posts: PostOrPage[] = [];

    for (const filename of filenames) {
      const filePath = path.join(POSTS_DIRECTORY, filename);
      const post = parseMarkdownFile(filePath);
      if (post) {
        posts.push(post);
      }
    }

    // 발행일 기준으로 정렬
    posts.sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime());

    // 페이지네이션 적용
    return posts.slice(start, start + limit);
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
}

// 슬러그로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<PostOrPage | null> {
  ensureDirectoryExists(POSTS_DIRECTORY);

  try {
    const filenames = fs.readdirSync(POSTS_DIRECTORY)
      .filter(name => name.endsWith('.md') || name.endsWith('.mdx'));

    for (const filename of filenames) {
      const filePath = path.join(POSTS_DIRECTORY, filename);
      const post = parseMarkdownFile(filePath);
      if (post && post.slug === slug) {
        return post;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding post by slug:', error);
    return null;
  }
}

// 모든 태그 가져오기
export async function getTags(limit: number | 'all' = 'all'): Promise<Tag[]> {
  const posts = await getPosts({ start: 0, limit: 1000 }); // 충분히 많은 수의 포스트 가져오기
  const tagMap = new Map<string, Tag>();

  posts.forEach(post => {
    post.tags?.forEach(tag => {
      if (tag.slug && !tagMap.has(tag.slug)) {
        tagMap.set(tag.slug, tag);
      }
    });
  });

  const tags = Array.from(tagMap.values())
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return limit === 'all' ? tags : tags.slice(0, limit);
}

// 태그별 포스트 필터링
export async function getPostsByTag(tagSlug: string, { start = 0, limit = 10 } = {}): Promise<PostOrPage[]> {
  const allPosts = await getPosts({ start: 0, limit: 1000 });
  const filteredPosts = allPosts.filter(post => 
    post.tags?.some(tag => tag.slug === tagSlug)
  );

  return filteredPosts.slice(start, start + limit);
}

// 관련 포스트 가져오기 (태그 기반)
export async function getRelatedPosts(currentPostSlug: string, tagSlugs: string[], limit: number = 6): Promise<PostOrPage[]> {
  const allPosts = await getPosts({ start: 0, limit: 1000 });
  
  const relatedPosts = allPosts
    .filter(post => post.slug !== currentPostSlug)
    .filter(post => 
      post.tags?.some(tag => tagSlugs.includes(tag.slug || ''))
    )
    .slice(0, limit);

  return relatedPosts;
}
