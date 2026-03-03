import { withPageAuth }
    from "@/lib/middleware/Interceptor.View.middleware";
import { StaffPageEditWidget }
    from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffPageEdit.widget';

export default withPageAuth(
    async function StaffTermsEditPage({ }) {
        return <StaffPageEditWidget pageType="TERMS" title="Terms of Use" />;
    },
    { path: '/staff/docs/terms', inlineHandlers: true }
);
