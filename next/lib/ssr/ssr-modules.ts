/**
 * SSR Modules Helper
 * 
 * Provides direct access to domain services from Server Components,
 * bypassing HTTP round-trips (which cause 429 rate limits via Cloudflare).
 * 
 * Usage:
 *   const card = await ssrModules().cards.getPublicCard(id);
 *   const category = await ssrModules().categories.getCategoryById(id);
 *   const store = await ssrModules().provider.get(id);
 */
import { ModuleFactory } from '@/lib/domain/Domain.factory';
import type { AuthContext } from '@/lib/domain/Domain.types';

const guestCtx: AuthContext = {
    userId: "guest",
    role: "guest",
} as AuthContext;

export const ssrModules = () => new ModuleFactory(guestCtx);
