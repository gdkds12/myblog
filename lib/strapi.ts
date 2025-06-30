// Strapi REST API is used – GraphQL querying removed due to schema mismatch.
import qs from 'qs';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_CMS_URL;

if (!STRAPI_URL) {
  throw new Error('STRAPI_URL (or NEXT_PUBLIC_CMS_URL) env variable is not defined');
}



/*
 * Data transformers ───────────────────────────────────────────────────
 */

const toGhostLikeTag = (tag: any) => ({
  id: tag.id,
  name: tag.attributes?.name,
  slug: tag.attributes?.slug,
});

const toGhostLikeAuthor = (author: any) => ({
  id: author?.id,
  name: author?.attributes?.name || author?.attributes?.username,
  slug: author?.attributes?.slug,
  profile_image: author?.attributes?.avatar?.data?.attributes?.url || null,
});

export const toGhostLikePost = (item: any) => {
  const { id, attributes } = item;
  return {
    id,
    slug: attributes.slug,
    title: attributes.title,
    html: attributes.content, // assuming richtext/markdown already converted; adjust as needed
    feature_image: attributes.cover?.data?.attributes?.url ?? null,
    excerpt: attributes.excerpt,
    tags: attributes.tags?.data?.map(toGhostLikeTag) ?? [],
    published_at: attributes.publishedAt,
    primary_author: attributes.author?.data ? toGhostLikeAuthor(attributes.author.data) : null,
  };
};

/*
 * Query helpers ────────────────────────────────────────────────────────
 */

export async function getPosts({ start = 0, limit = 10 } = {}) {
  // Build REST query string
  const queryString = qs.stringify(
    {
      pagination: { start, limit },
      sort: ['publishedAt:desc'],
      populate: ['cover', 'tags', 'author', 'author.avatar'],
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${STRAPI_URL}/api/articles?${queryString}`, {
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADERS,
    },
  });

  if (!res.ok) {
    throw new Error(`Strapi REST error: ${res.status}`);
  }

  const json = await res.json();
  const items = json.data ?? [];
  return items.map(toGhostLikePost);
}

export async function getPostBySlug(slug: string) {
  const queryString = qs.stringify(
    {
      filters: { slug: { $eq: slug } },
      populate: ['cover', 'tags', 'author', 'author.avatar'],
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${STRAPI_URL}/api/articles?${queryString}`, {
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADERS,
    },
  });

  if (!res.ok) {
    throw new Error(`Strapi REST error: ${res.status}`);
  }

  const json = await res.json();
  const item = json.data?.[0];
  return item ? toGhostLikePost(item) : null;
}
            content
            publishedAt
            cover { data {  url } } }
            tags { data { id  name  } } }
            author { data { id  username name  avatar { data {  url } } } } } }
          }
        }
      }
    }
  `;
  
  
  return item ? toGhostLikePost(item) : null;
}
