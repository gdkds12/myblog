// Shared type definitions replacing Ghost Content API types
export interface Tag {
  [key: string]: any;
  id: number | string;
  name?: string;
  slug?: string;
}

export interface Author {
  id: number | string;
  name?: string;
  slug?: string;
  profile_image?: string;
  avatar?: string; // fallback
}

export interface PostOrPage {
  [key: string]: any;
  id: number | string;
  slug: string;
  title: string;
  html?: string;
  feature_image?: string | null;
  excerpt?: string | null;
  tags?: Tag[];
  published_at?: string;
  primary_author?: Author | null;
  authors?: Author[];
}

// Alias for convenience
export type Post = PostOrPage;
