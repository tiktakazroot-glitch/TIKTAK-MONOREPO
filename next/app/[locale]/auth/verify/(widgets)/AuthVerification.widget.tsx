"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import {
    useState,
    useEffect,
    useRef
} from 'react';
import {
    useRouter,
    useSearchParams
} from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { Link } from '@/i18n/routing';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogo.tile';
import Image from 'next/image';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';
import { useTheme } from 'next-themes';

/**
 * Unified Verification Widget
 * 
 * Handles both email and phone verification with OTP codes.
 */
interface AuthVerificationWidgetProps {
    type: 'email' | 'phone';
    redirectPath?: string;
    backPath?: string;
    onSuccess?: () => void;
    onBack?: () => void;
    showLogo?: boolean;
    showBackLink?: boolean;
    title?: string;
}

export function AuthVerificationWidget({
    type,
    redirectPath = '/workspaces',
    backPath = '/auth/register',
    onSuccess,
    onBack,
    showLogo = true,
    showBackLink = true,
    title
}: AuthVerificationWidgetProps) {
    const { t } = loadClientSideCoLocatedTranslations('AuthVerificationWidget');
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        // updateFromAuthPayload, // Removed
        refreshProfile,
        isReady,
        loading,
        email: userEmail,
        emailVerified,
        phone: userPhone,
        phoneVerified
    } = useGlobalAuthProfileContext();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const logoSrc = mounted && resolvedTheme === 'dark' ? '/logowhite.svg' : '/logoblack.svg';

    // Get redirect parameter from URL
    const redirectFromQuery = searchParams.get('redirect') || redirectPath;

    // Initialize state
    const [targetState, setTargetState] = useState('');
    const [otp, setOtp] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasCodeBeenSent, setHasCodeBeenSent] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const hasVerifiedRef = useRef(false); // prevent redirect loop after verification
    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup cooldown interval on unmount
    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
        };
    }, []);

    function startCooldown() {
        setCooldownSeconds(120);
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = setInterval(() => {
            setCooldownSeconds((prev) => {
                if (prev <= 1) {
                    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    function formatCooldown(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    const isEmail = type === 'email';
    const currentTargetValue = isEmail ? userEmail : userPhone;
    const isTargetVerified = isEmail ? emailVerified : phoneVerified;

    // Sync target value from auth context or URL params (runs once on mount per type, since key={type} remounts)
    useEffect(() => {
        if (targetState) return; // already set, don't overwrite
        // Priority: auth context value → URL query param
        if (currentTargetValue) {
            setTargetState(currentTargetValue);
        } else {
            const fromUrl = searchParams.get(type);
            if (fromUrl) setTargetState(fromUrl);
        }
    }, [currentTargetValue, isReady]);

    // Debug logging
    useEffect(() => {
        ConsoleLogger.log(`✨ UNIFIED ${type.toUpperCase()} VERIFICATION WIDGET STATE:`, {
            type,
            currentTargetValue,
            targetState,
            isReady,
            loading,
            isTargetVerified
        });
    }, [type, currentTargetValue, targetState, isReady, loading, isTargetVerified]);

    // Dynamic texts based on type
    const texts = {
        title: title || t(`title_${type}`),
        description: t(`description_${type}`),
        label: t(type),
        sendButton: t('send_button'),
        resendButton: t('resend_button'),
        verifyButton: t(`verify_button_${type}`),
        backText: t('back_text'),
        successMessage: t(`success_message_${type}`),
        sendingMessage: t('sending_message'),
        verifyingMessage: t('verifying_message')
    };

    function isValidTarget(value: string) {
        if (isEmail) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else {
            const digits = value.replace(/\D/g, '');
            return digits.length >= 7 && digits.length <= 15;
        }
    }

    async function handleSendCode() {
        try {
            if (!targetState || !isValidTarget(targetState)) {
                toast.error(t(`enter_valid_${type}`));
                return;
            }

            setIsSending(true);

            const response = await apiCall({
                url: `/api/auth/verify?type=${type}&target=${encodeURIComponent(targetState.trim())}`,
                method: 'GET'
            });

            const result = await response;

            if (result.data?.error) {
                toast.error(result.data?.message || result.data?.error || t('error_sending_code'));
                return;
            }

            if (result.data?.alreadyVerified) {
                toast.info(result.data?.message || t(`already_verified_${type}`));
                router.push('/workspaces/profile');
            } else {
                toast.success(result.data?.message || t('code_sent'));
                if (result.data?.devCode) toast.info(`Dev code: ${result.data?.devCode}`);
            }

            setHasCodeBeenSent(true);
            startCooldown();
        } catch (err) {
            const error = err as { message?: string };
            toast.error(error?.message || t('failed_to_send'));
        } finally {
            setIsSending(false);
        }
    }

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (!otp || otp.length < 4) {
                toast.error(t('enter_verification_code'));
                return;
            }

            if (!targetState || !isValidTarget(targetState)) {
                toast.error(t(`enter_valid_${type}`));
                return;
            }

            setIsVerifying(true);

            const body = {
                type: type,
                target: targetState.trim(),
                otp
            };

            const response = await apiCall({
                url: '/api/auth/verify',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response;

            if (result.data?.error) {
                if (result.data?.error === 'Invalid or expired OTP' || result.data?.error === 'Invalid or expired code') {
                    toast.error(t('code_expired'));
                    setOtp('');
                    return;
                }

                toast.error(result.data?.message || result.data?.error || t('verification_error'));
                return;
            }

            toast.success(result.data?.message || texts.successMessage);
            hasVerifiedRef.current = true; // prevent useEffect redirect loop

            await refreshProfile();

            if (onSuccess) {
                onSuccess();
            } else if (isEmail) {
                // After email verified → go to phone verification
                const phoneFromUrl = searchParams.get('phone') || '';
                const phoneParam = phoneFromUrl ? `&phone=${encodeURIComponent(phoneFromUrl)}` : '';
                router.push(`/auth/verify?type=phone${phoneParam}`);
            } else {
                // After phone verified → go to final destination
                router.push(redirectFromQuery);
            }
        } catch (err) {
            const error = err as { message?: string };
            toast.error(error?.message || t('verification_failed'));
        } finally {
            setIsVerifying(false);
        }
    }

    function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
        const numeric = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(numeric);
    }

    function handleBackClick() {
        if (onBack) {
            onBack();
        } else {
            router.push(backPath);
        }
    }

    return (
        <div className="w-full flex justify-center items-center min-h-screen px-4 bg-gradient-to-br from-app-bright-purple/5 via-white dark:via-gray-950 to-gray-50 dark:to-gray-900">
            <div className="w-full max-w-md">
                <form onSubmit={handleVerify} className="bg-white dark:bg-gray-900 rounded-app shadow-lg border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-6">
                    {showLogo && (
                        <Link href="/" className={`inline-flex flex-col ${isEmail ? 'items-start' : 'items-center'} gap-2 text-app-dark-purple dark:text-white hover:text-app-bright-purple transition-colors`}>
                            <div className="relative h-8 w-28">
                                <Image
                                    src={logoSrc}
                                    alt="TikTak Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-xs text-app-dark-purple/70 dark:text-white/60">{t('back_to_home')}</span>
                        </Link>
                    )}

                    <div className={`space-y-2 ${isEmail ? 'text-left' : 'text-center'}`}>
                        <h1 className="text-3xl font-bold text-app-dark-purple dark:text-white">{texts.title}</h1>
                        <p className="text-sm text-app-dark-purple/70 dark:text-white/60">
                            {texts.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-app-dark-purple dark:text-white" htmlFor="target">
                                {texts.label}
                            </label>
                            <input
                                id="target"
                                name="target"
                                type={isEmail ? "email" : "tel"}
                                inputMode={isEmail ? "email" : "tel"}
                                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md py-3 px-3 text-app-dark-purple dark:text-white focus:outline-none focus:ring-2 focus:ring-app-bright-purple/20 focus:border-app-bright-purple focus:bg-white dark:focus:bg-gray-800 transition-all"
                                value={targetState}
                                onChange={(e) => setTargetState(e.target.value)}
                                disabled={hasCodeBeenSent}
                                required
                            />
                        </div>

                        {hasCodeBeenSent && (
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-app-dark-purple dark:text-white" htmlFor="otp">
                                    {t('verification_code')}
                                </label>
                                <input
                                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-text py-3 px-3 text-app-dark-purple dark:text-white focus:outline-none focus:ring-2 focus:ring-app-bright-purple/20 focus:border-app-bright-purple focus:bg-white dark:focus:bg-gray-800 text-center text-2xl font-mono tracking-widest transition-all"
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        {!hasCodeBeenSent ? (
                            /* Phase 1: Only show Send Code button */
                            <button
                                type="button"
                                onClick={handleSendCode}
                                className="w-full rounded-xl bg-app-bright-purple hover:bg-app-bright-purple/90 text-white font-semibold py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSending}
                            >
                                {isSending ? texts.sendingMessage : texts.sendButton}
                            </button>
                        ) : (
                            /* Phase 2: Show Verify button + Resend with cooldown */
                            <>
                                <button
                                    className="w-full rounded-xl bg-app-bright-purple hover:bg-app-bright-purple/90 text-white font-semibold py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? texts.verifyingMessage : texts.verifyButton}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    className="w-full rounded-xl bg-black/5 dark:bg-white/5 backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10 text-app-dark-purple dark:text-white font-semibold py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSending || cooldownSeconds > 0}
                                >
                                    {isSending
                                        ? texts.sendingMessage
                                        : cooldownSeconds > 0
                                            ? `${texts.resendButton} (${formatCooldown(cooldownSeconds)})`
                                            : texts.resendButton}
                                </button>
                            </>
                        )}

                        {showBackLink && (
                            <button
                                type="button"
                                onClick={handleBackClick}
                                className="w-full text-app-bright-purple hover:text-app-bright-purple/80 text-sm font-medium py-2 transition"
                            >
                                {texts.backText}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
