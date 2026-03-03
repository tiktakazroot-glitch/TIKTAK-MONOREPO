import { withPageAuth }
    from "@/lib/middleware/Interceptor.View.middleware";
import { StaffPageEditWidget }
    from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffPageEdit.widget';

export default withPageAuth(
    async function StaffPrivacyEditPage({ }) {
        return <StaffPageEditWidget pageType="PRIVACY" title="Privacy Policy" />;
    },
    { path: '/staff/docs/privacy', inlineHandlers: true }
);
