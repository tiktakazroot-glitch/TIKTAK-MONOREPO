/**
 * Client-safe Sanity read-only client.
 * Uses only NEXT_PUBLIC_* env vars — safe for browser.
 * For writes, use the server-side Cms.Sanity.client.ts instead.
 */
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

// ─── Lazy Read-Only Client (CDN-cached, no token) ───
let _sanityRead: ReturnType<typeof createClient> | null = null;

function getSanityRead() {
    if (!_sanityRead) {
        const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
        const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
        if (!projectId || !dataset) {
            throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET');
        }
        _sanityRead = createClient({
            projectId,
            dataset,
            apiVersion: '2024-01-01',
            useCdn: true,
        });
    }
    return _sanityRead;
}

export { getSanityRead as sanityRead };

// ─── Image URL Builder ───
export function sanityImageUrl(source: SanityImageSource) {
    return imageUrlBuilder(getSanityRead()).image(source);
}

// ─── GROQ Queries ───
export const GROQ = {
    // Pages / Docs
    pageByType: (type: string) =>
        `*[_type == "page" && pageType == "${type}"][0]`,
    allPages: `*[_type == "page"]`,

    // Blogs
    allBlogs: `*[_type == "blog" && isActive == true] | order(_createdAt desc) {
        _id,
        title,
        slug,
        cover,
        excerpt,
        isActive,
        isFeatured,
        _createdAt,
        _updatedAt
    }`,
    allBlogsAdmin: `*[_type == "blog"] | order(_createdAt desc) {
        _id,
        title,
        slug,
        cover,
        excerpt,
        isActive,
        isFeatured,
        _createdAt,
        _updatedAt
    }`,
    blogBySlug: (slug: string) =>
        `*[_type == "blog" && slug.current == "${slug}"][0]`,
    blogById: (id: string) =>
        `*[_type == "blog" && _id == "${id}"][0]`,
} as const;

// ─── Convenience Helpers ───

/**
 * Fetch a single page/doc by its type (ABOUT, FAQ, PRIVACY, etc.)
 * Returns the localized content for the given locale.
 */
export async function fetchPage(type: string, locale: string = 'en') {
    const page = await getSanityRead().fetch(GROQ.pageByType(type.toUpperCase()));
    if (!page) return null;

    // Extract localized content
    const localized = page.localizedContent?.[locale] || page.localizedContent?.en || {};
    return {
        title: localized.title || page.title || '',
        content: localized.content || '',
        cover: page.cover ? sanityImageUrl(page.cover).url() : undefined,
    };
}

/**
 * Fetch all active blogs.
 */
export async function fetchBlogs() {
    return getSanityRead().fetch(GROQ.allBlogs);
}

/**
 * Fetch all blogs (including inactive) for admin.
 */
export async function fetchBlogsAdmin() {
    return getSanityRead().fetch(GROQ.allBlogsAdmin);
}

/**
 * Fetch a single blog by slug.
 */
export async function fetchBlogBySlug(slug: string) {
    return getSanityRead().fetch(GROQ.blogBySlug(slug));
}

/**
 * Fetch a single blog by ID.
 */
export async function fetchBlogById(id: string) {
    return getSanityRead().fetch(GROQ.blogById(id));
}
