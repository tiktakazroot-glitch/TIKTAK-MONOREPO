import { redirect } from 'next/navigation';
import { withPageAuth } from '@/lib/middleware/Interceptor.View.middleware';

/**
 * Provider Workspace Root Page
 * Redirects to the cards page (default view)
 */
export default withPageAuth(ProviderRootPage, {
    path: '/workspaces/provider/:workspaceId'
});

async function ProviderRootPage({ params }: { params: Promise<{ workspaceId: string }> }) {
    const { workspaceId } = await params;
    redirect(`/workspaces/provider/${workspaceId}/cards`);
    return null as never;
}
