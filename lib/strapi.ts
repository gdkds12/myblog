// Strapi REST API is used – GraphQL querying removed due to schema mismatch.
import qs from 'qs';
import { marked } from 'marked';
import { getCachedJson, getString, setString, getRedis } from './cache';

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
    html: (() => {
      let extracted = '';
      const c = attrs.content;
      if (typeof c === 'string') extracted = c;
      else if (c && typeof c === 'object') {
        if (typeof c.html === 'string') extracted = c.html;
        else if (typeof c.data === 'string') extracted = c.data;
        else if (typeof c.value === 'string') extracted = c.value;
      }
      if (!extracted) {
        // try various direct fields
        extracted =
          attrs.html ??
          attrs.body ??
          attrs.content_html ??
          attrs.contentHtml ??
          attrs.contents ??
          attrs.markdown ??
          attrs.description ??
          '';
      }
      if (!extracted && Array.isArray(attrs.blocks)) {
        const parts: string[] = [];
        for (const blk of attrs.blocks) {
          if (typeof blk === 'string') parts.push(blk);
          else if (blk) {
            if (typeof blk.html === 'string') parts.push(blk.html);
            else if (typeof blk.body === 'string') parts.push(blk.body);
            else if (typeof blk.content === 'string') parts.push(blk.content);
            else if (typeof blk.text === 'string') parts.push(blk.text);
          }
        }
        extracted = parts.join('\n');
      }
      // If still no HTML tags, attempt Markdown ➜ HTML conversion first
      if (extracted && !/<[a-z][\s\S]*>/i.test(extracted)) {
        try {
          extracted = marked.parse(extracted) as string;
        } catch (_) {
          // fallback: basic newline=><br>
          extracted = extracted
            .split(/\n{2,}/)
            .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
            .join('\n');
        }
      }
      if (!extracted && process.env.NODE_ENV !== 'production') {
        console.warn('[toGhostLikePost] No html for id', id, 'keys', Object.keys(attrs));
      }
      return extracted;
    })(),
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
  let lastFetchedIso = await getString('posts:lastFetched');
  // Build REST query string
  const listKey = `posts:list:${start}:${limit}`;
  const lastFetchedKey = 'posts:lastFetched';
  const cached = await getCachedJson<any[]>(listKey);
  if (cached) {
    if (process.env.NODE_ENV !== 'production') console.log('[getPosts] cache hit', listKey, 'len', cached.length);
    // incremental update check
    const lastFetchedIso = await getString(lastFetchedKey);
    let newestIso = lastFetchedIso;
    try {
      if (lastFetchedIso) {
        const incrQuery = qs.stringify({
          filters: { updatedAt: { $gt: lastFetchedIso } },
          populate: '*',
          sort: 'updatedAt:asc',
        }, { encodeValuesOnly: true });
        const incrRes = await fetch(`${STRAPI_URL}/api/articles?${incrQuery}`, { headers: { ...AUTH_HEADERS } });
        if (incrRes.ok) {
          const incrJson = await incrRes.json();
          const changed = incrJson.data ?? [];
          if (changed.length) {
            // map and merge
            const mapped = changed.map(toGhostLikePost);
            const byId = new Map<any, any>(cached.map((p:any) => [p.id, p]));
            mapped.forEach(p => byId.set(p.id, p));
            const merged = Array.from(byId.values()).sort((a:any,b:any)=>new Date(b.published_at||b.publishedAt).getTime()-new Date(a.published_at||a.publishedAt).getTime()).slice(0, limit);
            const redis = getRedis();
            await redis.set(listKey, JSON.stringify(merged));
            newestIso = changed[changed.length-1].attributes?.updatedAt || newestIso;
            return merged;
          }
        }
      }
    } catch(e){ console.warn('[getPosts] incremental update failed', (e as Error).message);}  
  }

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
  const normalized = items.map(toGhostLikePost);
  const redis = getRedis();
  await redis.set(listKey, JSON.stringify(normalized));
  // record newest updatedAt
  const maxUpdated = items.reduce((max:string, it:any)=> {
    const u = it.attributes?.updatedAt || it.updatedAt || '';
    return u > max ? u : max;
  }, lastFetchedIso || '');
  if (maxUpdated) await setString(lastFetchedKey, maxUpdated);


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


