// Strapi REST API is used – GraphQL querying removed due to schema mismatch.
import qs from 'qs';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_CMS_URL;

if (!STRAPI_URL) {
  throw new Error('STRAPI_URL (or NEXT_PUBLIC_CMS_URL) env variable is not defined');
}

// Common headers for authenticated requests
const AUTH_HEADERS: Record<string, string> = process.env.STRAPI_TOKEN ? {
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
} : {};



/*
 * Data transformers ───────────────────────────────────────────────────
 */

const toGhostLikeTag = (tag: any) => ({
  id: tag.id,
  name: tag.attributes?.name ?? tag.name,
  slug: tag.attributes?.slug ?? tag.slug,
});

const toGhostLikeAuthor = (author: any) => ({
  id: author?.id,
  name: author?.attributes?.name || author?.attributes?.username,
  slug: author?.attributes?.slug,
  profile_image: author?.attributes?.avatar?.data?.attributes?.url || null,
});

export const toGhostLikePost = (item: any) => {
  // Strapi may return nested {attributes} or flat fields depending on response style
  const id = item.id;
  const attrs = item.attributes ?? item;
  // simple slugify fallback (lowercase, replace spaces/invalid chars with hyphens)
  const ensureSlug = (value: string) => value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // keep alphanum, space, dash
    .replace(/\s+/g, '-')         // spaces -> dash
    .replace(/-+/g, '-')           // collapse multiple dashes
    .replace(/^-+|-+$/g, '');      // trim leading/trailing dashes

  // Robustly derive slug. Fallback to `post-<id>` when every option yields an empty slug.
  const derivedSlug = (() => {
    const candidates = [attrs.slug, attrs.uid, attrs.title].filter(Boolean);
    for (const cand of candidates) {
      const slugified = ensureSlug(cand);
      if (slugified) return slugified;
    }
    return `post-${id}`;
  })();

  return {
    id,
    slug: derivedSlug,
    title: attrs.title,
    html: attrs.content ?? attrs.description ?? '',
    feature_image: (() => {
      const url =
        attrs.cover?.data?.attributes?.url ??
        attrs.cover_url ??
        attrs.cover?.url ??
        null;
      if (!url) return null;
      return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
    })(),
    excerpt: attrs.excerpt ?? attrs.description ?? '',
    tags: (() => {
      const arr = (attrs.tags?.data ?? attrs.tags ?? []).map(toGhostLikeTag);
      if (arr.length === 0) {
        const catsSrc = attrs.categories ?? attrs.category;
        if (catsSrc) {
          const cats = catsSrc?.data ?? catsSrc;
          if (Array.isArray(cats)) {
            cats.forEach((c:any)=>{ if(c) arr.push(toGhostLikeTag(c)); });
          } else {
            arr.push(toGhostLikeTag(cats));
          }
        }
      }
      return arr;
    })(),
    published_at: attrs.publishedAt ?? attrs.published_at,
    primary_author: attrs.author?.data ? toGhostLikeAuthor(attrs.author.data) : null,
  };
};

/*
 * Query helpers ────────────────────────────────────────────────────────
 */

export async function getPosts({ start = 0, limit = 10 } = {}) {
  // Build REST query string
  if (process.env.NODE_ENV !== 'production') {
    console.log('[getPosts] STRAPI_URL', STRAPI_URL);
  }
  const queryString = qs.stringify(
    {
      pagination: { start, limit },
      sort: 'publishedAt:desc',
      populate: '*',
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${STRAPI_URL}/api/articles?${queryString}`, {
    headers: {
      ...AUTH_HEADERS,
    },
  });

  if (!res.ok) {
    throw new Error(`Strapi REST error: ${res.status}`);
  }

  const json = await res.json();
  if ((json.data ?? []).length === 0) {
    console.log('[getPosts] raw json', JSON.stringify(json).slice(0,500));
  }
  const items = json.data ?? [];
  console.log('[getPosts] total:', items.length);   // ← 추가
  return items.map(toGhostLikePost);
}

export async function getTags(limit: number | 'all' = 'all') {
  const queryObj: any = { sort: 'name:asc' };
  if (limit !== 'all') {
    queryObj.pagination = { limit };
  }
  const queryString = qs.stringify(queryObj, { encodeValuesOnly: true });
  const res = await fetch(`${STRAPI_URL}/api/tags?${queryString}`, {
    headers: {
      ...AUTH_HEADERS,
    },
    next: { revalidate: 300 },
  });
  if (res.status === 404) {
    // Tags collection not found – return empty list instead of crashing the page
    return [];
  }
  if (!res.ok) throw new Error(`Strapi REST error: ${res.status}`);
  const json = await res.json();
  return (json.data ?? []).map((item: any) => ({
    id: item.id,
    name: item.attributes?.name,
    slug: item.attributes?.slug,
    description: item.attributes?.description ?? null,
  }));
}

export async function getPostBySlug(slug: string) {
  // If slug is of the form "post-<id>", try fetching directly by numeric ID.
  const idMatch = slug.match(/^post-(\d+)$/);
  if (idMatch) {
    const id = idMatch[1];
    const resById = await fetch(`${STRAPI_URL}/api/articles/${id}?populate=*`, {
      headers: {
        ...AUTH_HEADERS,
      },
    });
    if (resById.ok) {
      const jsonById = await resById.json();
      if (jsonById.data) {
        return toGhostLikePost(jsonById.data);
      }
    }
    // If fetching by ID fails (e.g., 404), fall-through to slug query below.
  }

  const queryString = qs.stringify(
    {
      filters: { slug: { $eq: slug } },
      populate: '*',
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${STRAPI_URL}/api/articles?${queryString}`, {
    headers: {
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


