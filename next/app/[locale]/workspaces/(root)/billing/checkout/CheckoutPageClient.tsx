"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { PiCheckCircleFill, PiArrowsClockwiseBold, PiArrowLeftBold } from 'react-icons/pi';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import Link from 'next/link';

export function CheckoutPageClient() {
    const t = useTranslations('CheckoutPage');
    const searchParams = useSearchParams();
    const tierId = searchParams.get('tierId');

    const [tier, setTier] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tierId) {
            setLoading(false);
            return;
        }

        const fetchTierDetails = async () => {
            try {
                // Determine API endpoint based on tier ID structure or context
                // For root workspace billing, we use the root endpoint
                const response = await apiCall({
                    method: 'GET',
                    url: `/api/workspaces/billing/tiers`
                });

                if (response.data && Array.isArray(response.data)) {
                    const foundTier = response.data.find((t: any) => t.id === tierId);
                    if (foundTier) {
                        setTier(foundTier);
                    } else {
                        setError("Plan not found.");
                    }
                } else {
                    setError("Failed to load plans.");
                }
            } catch (err: any) {
                console.error("Failed to fetch tier details", err);
                setError(err.message || "Failed to load plan details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTierDetails();
    }, [tierId]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setError(null);
        try {
            setActionLoading('coupon');
            const response = await apiCall({
                method: 'POST',
                url: `/api/workspaces/billing/coupon`,
                body: { code: couponCode }
            });
            if (response.data) {
                setAppliedCoupon(response.data);
            }
        } catch (error: any) {
            setAppliedCoupon(null);
            setError(error.message || "Invalid coupon code.");
        } finally {
            setActionLoading(null);
        }
    };

    const handlePayment = async () => {
        if (!tier) return;
        try {
            setActionLoading('pay');
            const response = await apiCall({
                method: 'POST',
                url: `/api/workspaces/billing/pay`,
                body: {
                    tierId: tier.id,
                    couponCode: appliedCoupon?.code,
                    language: 'az' // Defaulting to 'az' as in original code, could be dynamic
                }
            });

            if (response.data && response.data.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            } else {
                setError("Failed to initiate payment. Please try again.");
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            setError(error.message || "Something went wrong during payment initialization.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <PiArrowsClockwiseBold className="text-4xl text-brand-primary animate-spin" />
        </div>
    );

    if (!tierId || !tier) return (
        <div className="max-w-2xl mx-auto p-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-4">{error || "Plan not found"}</h1>
            <Link href="/workspaces/billing" className="text-brand-primary font-bold hover:underline">
                Return to Plans
            </Link>
        </div>
    );

    const discount = appliedCoupon?.discountPercent || 0;
    const finalPrice = tier.price * (1 - discount / 100);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Link href="/workspaces/billing" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors">
                <PiArrowLeftBold />
                Back to Plans
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: Plan Details */}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Checkout</h1>
                    <p className="text-slate-500 mb-8">Complete your subscription upgrade.</p>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{tier.title}</h3>
                                <p className="text-sm text-slate-500 font-medium">Billed Monthly</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black block">
                                    {tier.price} <span className="text-sm text-slate-500">AZN</span>
                                </span>
                            </div>
                        </div>

                        <hr className="border-slate-100 my-4" />

                        <div className="space-y-3">
                            {tier.metadata?.features?.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <PiCheckCircleFill className="text-emerald-500 mt-1 flex-shrink-0" />
                                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment & Coupon */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Order Summary</h3>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-600 font-medium">Subtotal</span>
                            <span className="font-bold">{tier.price.toFixed(2)} AZN</span>
                        </div>

                        {appliedCoupon && (
                            <div className="flex justify-between items-center mb-2 text-emerald-600">
                                <span className="font-bold flex items-center gap-1">
                                    <PiCheckCircleFill /> Coupon ({appliedCoupon.code})
                                </span>
                                <span className="font-bold">-{discount}%</span>
                            </div>
                        )}

                        <hr className="border-slate-200 my-4" />

                        <div className="flex justify-between items-end mb-8">
                            <span className="text-lg font-black text-slate-900">Total</span>
                            <div className="text-right">
                                {appliedCoupon && (
                                    <span className="text-sm text-slate-400 line-through block font-medium">
                                        {tier.price.toFixed(2)} AZN
                                    </span>
                                )}
                                <span className="text-3xl font-black text-brand-primary">
                                    {finalPrice.toFixed(2)} <span className="text-lg text-slate-900">AZN</span>
                                </span>
                            </div>
                        </div>

                        {/* Coupon Input */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Have a coupon?</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter code"
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase font-bold text-sm bg-white"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponCode || actionLoading === 'coupon'}
                                    className="px-4 py-3 rounded-xl bg-slate-200 text-slate-900 font-bold hover:bg-slate-300 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {actionLoading === 'coupon' ? <PiArrowsClockwiseBold className="animate-spin" /> : 'Apply'}
                                </button>
                            </div>
                            {error && (
                                <p className="text-red-500 text-xs font-bold mt-2">{error}</p>
                            )}
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={!!actionLoading}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-brand-primary hover:text-slate-900 transition-all shadow-lg hover:shadow-brand-primary/20 flex items-center justify-center gap-2"
                        >
                            {actionLoading === 'pay' ? (
                                <PiArrowsClockwiseBold className="animate-spin text-xl" />
                            ) : (
                                <>Pay Now</>
                            )}
                        </button>

                        <p className="text-xs text-center text-slate-400 mt-4 font-medium">
                            Secure payment processed by stripe.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
