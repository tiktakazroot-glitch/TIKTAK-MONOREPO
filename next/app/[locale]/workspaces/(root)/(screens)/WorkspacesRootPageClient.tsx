'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { PiPlusBold, PiArrowsClockwiseBold } from 'react-icons/pi';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { PiBuildings, PiUserGear, PiBriefcase } from 'react-icons/pi';

interface Workspace {
    workspaceId: string;
    workspaceType: 'provider' | 'staff';
    title: string;
    description: string;
    routePath: string;
}

export function WorkspacesRootPageClient() {
    const { t } = loadClientSideCoLocatedTranslations('WorkspacesRootPageClient');
    const { firstName, getInitials } = useGlobalAuthProfileContext();
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [initializing, setInitializing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            setLoading(true);
            const response = await apiCall({
                url: '/api/workspaces/list',
                method: 'GET'
            });

            const data = response?.data;
            if (data && Array.isArray(data)) {
                if (data.length === 0) {
                    // Legacy user with 0 workspaces → auto-initialize
                    await initializeWorkspace();
                } else {
                    setWorkspaces(data);
                }
            } else if (data?.success && Array.isArray(data?.data)) {
                if (data.data.length === 0) {
                    await initializeWorkspace();
                } else {
                    setWorkspaces(data.data);
                }
            } else {
                // Try to extract workspaces from whatever shape we got
                const ws = data?.data || data;
                if (Array.isArray(ws) && ws.length === 0) {
                    await initializeWorkspace();
                } else if (Array.isArray(ws)) {
                    setWorkspaces(ws);
                } else {
                    throw new Error('Unexpected response format');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const initializeWorkspace = async () => {
        try {
            setInitializing(true);
            const response = await apiCall({
                url: '/api/workspaces/initialize',
                method: 'POST'
            });

            const result = response?.data;
            if (result?.workspaces && result.workspaces.length > 0) {
                setWorkspaces(result.workspaces);
            }
        } catch (err: any) {
            console.error('[WorkspaceInit] Failed to initialize workspace:', err);
            setError('Failed to create your workspace. Please try again.');
        } finally {
            setInitializing(false);
        }
    };

    const getWorkspaceIcon = (type: string) => {
        switch (type) {
            case 'provider': return <PiBuildings className="text-2xl" />;
            case 'tutor': return <PiUserGear className="text-2xl" />;
            case 'staff': return <PiBriefcase className="text-2xl" />;
            default: return <PiBuildings className="text-2xl" />;
        }
    };

    const getWorkspaceUrl = (workspace: Workspace) => {
        return `/workspaces/${workspace.workspaceType}/${workspace.workspaceId}`;
    };

    // Show initializing state
    if (initializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 animate-in fade-in duration-500">
                <PiArrowsClockwiseBold className="text-4xl text-brand-primary animate-spin" />
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Setting up your workspace...</p>
                <p className="text-sm text-slate-400">This only takes a moment</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {t('welcome_back')}, <span className="text-brand">{firstName || 'User'}</span>
                    </h1>
                    <p className="text-body font-medium opacity-70">
                        {t('select_workspace_message')}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-primary border border-border/50 animate-pulse h-40"></div>
                    ))}
                </div>
            ) : workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.workspaceId}
                            href={getWorkspaceUrl(workspace)}
                            className="group bg-white dark:bg-slate-800 p-6 rounded-primary border border-border/50 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                                    {getWorkspaceIcon(workspace.workspaceType)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                                        {workspace.title}
                                    </h3>
                                    <p className="text-sm text-body opacity-60 font-medium line-clamp-1 uppercase tracking-widest mt-1">
                                        {workspace.workspaceType}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center text-brand font-bold text-sm">
                                {t('go_to_workspace')} →
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/50 dark:bg-slate-800/50 border-2 border-dashed border-border rounded-primary p-12 flex flex-col items-center justify-center text-center space-y-4 col-span-full">
                        <p className="text-body font-medium max-w-xs opacity-60">
                            {t('no_active_workspaces_message')}
                        </p>
                        <button
                            onClick={() => initializeWorkspace()}
                            className="text-brand font-bold hover:underline"
                        >
                            Create My Workspace
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg font-medium border border-red-100 dark:border-red-800">
                    {error}
                </div>
            )}
        </div>
    );
}
