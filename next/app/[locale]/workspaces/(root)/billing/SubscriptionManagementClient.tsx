"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PiCrownBold, PiArrowsClockwiseBold, PiReceiptBold, PiBuildingsBold } from 'react-icons/pi';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

export function SubscriptionManagementClient() {
    const { getEffectiveSubscription, loading: profileLoading } = useGlobalAuthProfileContext();
    const params = useParams();
    const workspaceId = params.workspaceId as string || 'root';

    const [activeTab, setActiveTab] = useState<'subscriptions' | 'transactions'>('subscriptions');

    // Data States
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Subscriptions (Enrolled Providers)
                const subsRes = await apiCall({
                    method: 'GET',
                    url: `/api/workspaces/billing/subscriptions`
                });
                const subsData = (subsRes as any).data || subsRes;
                if (subsData && (subsData.success || Array.isArray(subsData.data || subsData))) {
                    setSubscriptions(Array.isArray(subsData) ? subsData : (subsData.data || []));
                }

                // Fetch Transactions
                const transRes = await apiCall({
                    method: 'GET',
                    url: `/api/workspaces/billing/transactions`
                });
                const transData = (transRes as any).data || transRes;

                if (Array.isArray(transData)) {
                    setTransactions(transData);
                } else if (transData && Array.isArray(transData.data)) {
                    setTransactions(transData.data);
                }

            } catch (error) {
                console.error("Failed to fetch billing data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading || profileLoading) return (
        <div className="flex items-center justify-center p-24">
            <PiArrowsClockwiseBold className="text-4xl text-brand-primary animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Billing & Subscriptions</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your provider subscriptions and payment history</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'subscriptions'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Active Subscriptions
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'transactions'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Transactions
                </button>
            </div>

            {/* Content */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                    {subscriptions.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <PiCrownBold className="mx-auto text-4xl text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">No active subscriptions</h3>
                            <button className="mt-4 px-6 py-2 bg-brand-primary text-white font-bold rounded-xl" onClick={() => window.location.href = '/workspaces'}>
                                Browse Providers
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subscriptions.map((item: any) => {
                                const daysLeft = item.access?.subscribedUntil
                                    ? Math.ceil((new Date(item.access.subscribedUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                                    : 0;
                                const isExpired = daysLeft <= 0;

                                return (
                                    <div key={item.workspace.id} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl">
                                                        <PiBuildingsBold />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.workspace.title}</h3>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.workspace.type}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isExpired ? 'bg-red-50 text-red-500 dark:bg-red-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                                                    }`}>
                                                    {isExpired ? 'Expired' : 'Active'}
                                                </span>
                                            </div>

                                            <div className="mb-6">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                    {`Expires in ${Math.max(0, daysLeft)} days`}
                                                </p>
                                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${isExpired ? 'bg-red-500' : 'bg-brand-primary'}`}
                                                        style={{ width: `${Math.min(100, Math.max(0, (daysLeft / 30) * 100))}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <span className="text-xs font-bold text-slate-400">
                                                {item.access?.subscribedUntil ? new Date(item.access.subscribedUntil).toLocaleDateString() : 'N/A'}
                                            </span>
                                            {isExpired && (
                                                <button className="text-xs font-bold text-brand-primary uppercase hover:underline">
                                                    Renew Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'transactions' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <PiReceiptBold className="mx-auto text-4xl text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">No transactions yet</h3>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                                            {tx.paidAmount} AZN
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                                                tx.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                            {tx.metadata?.tierType || tx.metadata?.role || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
