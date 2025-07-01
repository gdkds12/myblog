import Image from 'next/image';
import { PostOrPage } from "@/lib/types";

export default function PostContent({ post }: { post: PostOrPage }) {
  return (
    <article className="w-full px-4 sm:px-0 mt-10"> {/* 모바일에서는 좌우 패딩을 제거 */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      {post.feature_image && (
        <Image
          src={post.feature_image}
          alt={post.title || ''}
          width={800}
          height={400}
          className="rounded-lg mb-6"
        />
      )}
      <div className="prose lg:prose-xl" dangerouslySetInnerHTML={{ __html: post.html || '' }} />
    </article>
  );
}
