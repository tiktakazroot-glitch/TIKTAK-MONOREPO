import { withPageAuth }
    from "@/lib/middleware/Interceptor.View.middleware";
import { StaffPageEditWidget }
    from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffPageEdit.widget';

export default withPageAuth(
    async function StaffAboutEditPage({ }) {
        return <StaffPageEditWidget pageType="ABOUT" title="About us" />;
    },
    { path: '/staff/docs/about', inlineHandlers: true }
);
