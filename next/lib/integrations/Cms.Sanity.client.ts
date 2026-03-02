import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

// ─── Environment (resolved lazily to survive build-time) ───

let _sanityClient: ReturnType<typeof createClient> | null = null;
let _sanityWriteClient: ReturnType<typeof createClient> | null = null;

function getConfig() {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
    const token = process.env.SANITY_TOKEN;
    if (!projectId || !dataset) {
        throw new Error('Missing SANITY_PROJECT_ID or SANITY_DATASET env vars');
    }
    return { projectId, dataset, token };
}

// ─── Read Client (CDN-cached, public) ───
export function getSanityClient() {
    if (!_sanityClient) {
        const { projectId, dataset } = getConfig();
        _sanityClient = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: true });
    }
    return _sanityClient;
}

export { getSanityClient as sanityClient };

// ─── Write Client (authenticated, no CDN) ───
export function getSanityWriteClient() {
    if (!_sanityWriteClient) {
        const { projectId, dataset, token } = getConfig();
        _sanityWriteClient = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token });
    }
    return _sanityWriteClient;
}

export { getSanityWriteClient as sanityWriteClient };

// ─── Image URL Builder ───
export function sanityImageUrl(source: SanityImageSource) {
    return imageUrlBuilder(getSanityClient()).image(source);
}

// ─── Common GROQ Queries ───
export const GROQ = {
    // Pages
    pageByType: (type: string) => `*[_type == "page" && type == "${type}"][0]`,
    allPages: `*[_type == "page"]`,

    // Blogs
    allBlogs: `*[_type == "blog" && isActive == true] | order(_createdAt desc)`,
    blogBySlug: (slug: string) => `*[_type == "blog" && slug.current == "${slug}"][0]`,
    blogById: (id: string) => `*[_type == "blog" && _id == "${id}"][0]`,
    allBlogsAdmin: `*[_type == "blog"] | order(_createdAt desc)`,
} as const;
