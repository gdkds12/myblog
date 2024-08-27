import Image from 'next/image';
import { PostOrPage } from "@tryghost/content-api";

export default function PostContent({ post }: { post: PostOrPage }) {
  return (
    <article className="max-w-2xl mx-auto mt-10">
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
