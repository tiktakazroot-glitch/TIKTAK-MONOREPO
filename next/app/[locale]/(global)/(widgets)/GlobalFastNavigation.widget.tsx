'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import type { DomainNavConfig, FastNavLink } from '@tiktak/shared/types/ui/Navigation.types';
import { PiListBold, PiXBold, PiHouseBold, PiMagnifyingGlassBold, PiPlusCircleBold, PiMegaphoneBold, PiSignInBold, PiUserPlusBold } from 'react-icons/pi';
import { GlobalNotificationBadgeTile } from '@/app/[locale]/(global)/(tiles)/GlobalNotificationBadge.tile';
import { GlobalProfileAvatarTile } from '@/app/[locale]/(global)/(tiles)/GlobalProfileAvatar.tile';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

interface GlobalFastNavigationWidgetProps {
    navConfig: DomainNavConfig;
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
}

export function GlobalFastNavigationWidget({
    navConfig,
    isMenuOpen,
    setIsMenuOpen,
}: GlobalFastNavigationWidgetProps) {
    const pathname = usePathname();
    const isPublic = navConfig.domain === 'public';
    const { userId } = useGlobalAuthProfileContext();
    const isAuthenticated = !!userId;

    const fastNavLinks: FastNavLink[] = navConfig.fastNavLinks?.length ? navConfig.fastNavLinks : [
        { href: '/', icon: PiHouseBold, label: 'Home' },
        { href: '/cards', icon: PiMagnifyingGlassBold, label: 'Cards' },
        { href: '/create', icon: PiPlusCircleBold, label: 'Create' },
    ];

    // Label visibility: hide labels on mobile if > 2 links to save space
    const showLabels = fastNavLinks.length <= 2;

    return (
        <>
            {/* ═══ Mobile Bottom Bar ═══ */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-app-dark-purple border-t border-app-dark-purple/10 dark:border-white/10 flex items-center justify-around px-2 lg:hidden transition-colors duration-300">
                {fastNavLinks.map((item, idx) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={idx}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${isActive ? 'text-app-bright-purple' : 'text-app-dark-purple/50 dark:text-white/50'
                                }`}
                        >
                            <Icon size={22} className={isActive ? 'animate-pulse' : ''} />
                            {showLabels && (
                                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                            )}
                        </Link>
                    );
                })}

                {/* Notifications */}
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                    <GlobalNotificationBadgeTile dropdownPosition="up" className="!static" />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-app-dark-purple/50 dark:text-white/50 mt-1">Inbox</span>
                </div>

                {/* Menu toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${isMenuOpen ? 'text-app-bright-purple' : 'text-app-dark-purple/50 dark:text-white/50'
                        }`}
                >
                    {isMenuOpen ? <PiXBold size={22} /> : <PiListBold size={22} />}
                    <span className="text-[10px] font-bold uppercase tracking-tight">Menu</span>
                </button>
            </nav>

            {/* ═══ Desktop Quick Actions (inline in header) ═══ */}
            <div className="hidden lg:flex items-center gap-3">
                {/* FastNav links — with full text */}
                {navConfig.fastNavLinks?.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={idx}
                            href={item.href}
                            className={`px-3 py-2 rounded-app transition-all flex items-center gap-2 text-sm font-medium ${isActive
                                ? 'text-app-bright-purple bg-app-bright-purple/10'
                                : 'text-app-dark-purple dark:text-white/80 hover:text-app-bright-purple hover:bg-app-bright-purple/5'
                                }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Create Card button */}
                <Link
                    href="/workspaces"
                    className="px-3 py-2 rounded-app transition-all flex items-center gap-2 text-sm font-medium text-app-dark-purple dark:text-white/80 hover:text-app-bright-purple hover:bg-app-bright-purple/5"
                >
                    <PiMegaphoneBold size={18} />
                    <span>Create Card</span>
                </Link>

                {/* Auth: Login/Register or Profile */}
                {isAuthenticated ? (
                    <>
                        <GlobalNotificationBadgeTile dropdownPosition="down" />
                        <GlobalProfileAvatarTile />
                    </>
                ) : (
                    <>
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 rounded-app text-sm font-semibold bg-app-bright-cyan text-app-dark-purple hover:bg-app-bright-cyan/80 transition-all flex items-center gap-2"
                        >
                            <PiSignInBold size={18} />
                            Login
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 rounded-app text-sm font-semibold bg-app-bright-purple text-white hover:bg-app-bright-blue transition-all flex items-center gap-2"
                        >
                            <PiUserPlusBold size={18} />
                            Register
                        </Link>
                    </>
                )}

                {/* Menu toggle button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`px-3 py-2 rounded-app transition-all flex items-center gap-2 font-medium text-sm ${isMenuOpen
                        ? 'text-app-bright-purple bg-app-bright-purple/10'
                        : 'text-app-dark-purple dark:text-white/80 hover:text-app-bright-purple hover:bg-app-bright-purple/5'
                        }`}
                    title="Toggle Menu"
                >
                    {isMenuOpen ? <PiXBold size={18} /> : <PiListBold size={18} />}
                    <span>Menu</span>
                </button>
            </div>
        </>
    );
}
