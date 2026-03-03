import { withPageAuth }
    from "@/lib/middleware/Interceptor.View.middleware";
import { StaffPageEditWidget }
    from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffPageEdit.widget';

export default withPageAuth(
    async function StaffFaqEditPage({ }) {
        return <StaffPageEditWidget pageType="FAQ" title="FAQ" />;
    },
    { path: '/staff/docs/faq', inlineHandlers: true }
);
