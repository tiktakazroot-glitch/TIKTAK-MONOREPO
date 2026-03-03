import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler, UnifiedContext } from '@/lib/middleware/Interceptor.Api.middleware';
import { favoriteCards } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * Handle GET /api/favorites
 * Returns array of card IDs the logged-in user has favorited
 */
export const GET = unifiedApiHandler(async (req: NextRequest, ctx: UnifiedContext) => {
    const accountId = ctx.authData?.account?.id;
    const { log, db } = ctx;

    // Not authenticated — return empty favorites
    if (!accountId) {
        return okResponse({ favoriteIds: [] });
    }

    try {
        const rows = await db.select({
            cardId: favoriteCards.cardId
        })
            .from(favoriteCards)
            .where(eq(favoriteCards.accountId, accountId));

        // Map array of objects to array of strings
        const favoriteIds = rows.map((r: { cardId: string | null }) => r.cardId).filter(Boolean) as string[];

        return okResponse({ favoriteIds });
    } catch (error) {
        log.error('Failed to fetch user favorites', { error, accountId });
        return errorResponse('Failed to fetch user favorites', 500);
    }
});

