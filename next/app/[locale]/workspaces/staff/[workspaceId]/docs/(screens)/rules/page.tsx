import { withPageAuth }
    from "@/lib/middleware/Interceptor.View.middleware";
import { StaffPageEditWidget }
    from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffPageEdit.widget';

export default withPageAuth(
    async function StaffRulesEditPage({ }) {
        return <StaffPageEditWidget pageType="RULES" title="Rules" />;
    },
    { path: '/staff/docs/rules', inlineHandlers: true }
);
