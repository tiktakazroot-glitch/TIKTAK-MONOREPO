'use client'

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from 'react';
import { Link }
    from '@/i18n/routing';
import { useRouter }
    from 'next/navigation';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import {
    PiUserCircleLight,
    PiCaretDownLight,
    PiSignOutLight,
    PiUserLight,
    PiStorefrontLight,
    PiSignInLight,
    PiUserPlusLight
} from "react-icons/pi";
import AuthLogoutButtonWidget
    from '@/app/[locale]/auth/logout/AuthLogoutButton.widget';
import { loadClientSideCoLocatedTranslations }
    from '@/i18n/i18nClientSide';

function PublicProfileDropdownWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userAccounts, setUserAccounts] = useState<any[]>([]);
    const [currentAccount, setCurrentAccount] = useState<any | null>(null);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; right: number; bottom?: number }>({ top: 0, right: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { t } = loadClientSideCoLocatedTranslations('PublicProfileDropdownWidget');

    // Check if mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Calculate position based on mobile/desktop
            if (isMobile) {
                // On mobile, position from bottom of viewport
                const bottomPosition = viewportHeight - rect.top + 8; // 8px spacing above button
                setDropdownPosition({
                    bottom: bottomPosition,
                    right: window.innerWidth - rect.right,
                    top: undefined // Clear top property for mobile
                });
            } else {
                // On desktop, position from top (below the button)
                const topPosition = rect.bottom + scrollY + 8; // 8px spacing below button
                setDropdownPosition({
                    top: topPosition,
                    right: window.innerWidth - rect.right,
                    bottom: undefined // Clear bottom property for desktop
                });
            }
        }
    }, [isOpen, isMobile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchUserAccounts = useCallback(async () => {
        try {
            const response = await apiCall({
                url: '/api/auth/accounts',
                method: 'GET'
            });

            if (response.data) {
                setIsAuthenticated(true);
                setUserAccounts(response.data.accounts || []);
                setCurrentAccount(response.data.currentAccount);
                setCurrentUser(response.data.user);
            }
        } catch (error: any) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setIsAuthenticated(false);
                setUserAccounts([]);
                setCurrentAccount(null);
                setCurrentUser(null);
            } else {
                ConsoleLogger.error('Error fetching user accounts:', error);
                setIsAuthenticated(false);
                setUserAccounts([]);
                setCurrentAccount(null);
                setCurrentUser(null);
            }
        }
    }, []);

    const handleDropdownClick = useCallback(() => {
        if (!isOpen) {
            fetchUserAccounts();
        }
        setIsOpen(!isOpen);
    }, [isOpen, fetchUserAccounts]);

    const handleAccountSwitch = useCallback(async (accountId: number) => {
        if (accountId === currentAccount?.id) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiCall({
                url: '/api/auth/accounts/switch',
                method: 'POST',
                body: JSON.stringify({ accountId })
            });

            if (response.status === 200) {
                window.location.reload();
            } else {
                ConsoleLogger.error('Failed to switch account');
            }
        } catch (error) {
            ConsoleLogger.error('Error switching account:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount?.id]);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            router.push('/auth/login');
            router.refresh();
        } catch (error) {
            ConsoleLogger.error('Logout failed:', error);
        }
    }, [router]);

    const getAccountDisplayName = useCallback((account: any) => {
        if (!account) return t('loading');
        if (account.is_personal) {
            return `${currentUser?.name || 'Personal'} ${currentUser?.last_name || ''}`.trim();
        }
        return account.stores?.title || 'Store Account';
    }, [currentUser, t]);

    const getAccountAvatar = useCallback((account: any) => {
        if (!account) return null;
        if (account.is_personal && currentUser?.avatar_base64) {
            return currentUser.avatar_base64;
        }
        if (account.is_personal && currentUser?.avatar_url) {
            return currentUser.avatar_url;
        }
        // Return null for personal accounts without avatar, or handle store accounts
        if (account.is_personal) {
            return null;
        }
        const store = account.stores;
        if (!store) return null;
        return `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${store.id}/${store.logo || store.cover || null}`;
    }, [currentUser]);

    const getAccountSubtitle = useCallback((account: any) => {
        if (!account) return '';
        if (!account.is_personal) {
            return currentUser?.name
                ? `${currentUser.name} ${currentUser.last_name || ''}`.trim()
                : t('store_owner');
        }
        return currentUser?.email || '';
    }, [currentUser, t]);

    const alternativeAccounts = useMemo(() => {
        return userAccounts.filter(account => account.id !== currentAccount?.id);
    }, [userAccounts, currentAccount?.id]);

    const dropdownStyle = useMemo<React.CSSProperties>(() => ({
        position: 'fixed',
        ...(isMobile
            ? { bottom: `${dropdownPosition.bottom}px` }
            : { top: `${dropdownPosition.top}px` }
        ),
        right: `${dropdownPosition.right}px`,
        width: isMobile ? '256px' : '288px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        zIndex: 9999999,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: isMobile ? '60vh' : '80vh',
        overflowY: 'auto'
    }), [isMobile, dropdownPosition]);

    return (
        <div className="relative">
            <div className="flex items-center gap-1">
                <Link
                    href="/workspaces/profile"
                    className="p-2 hover:bg-app-bright-purple rounded-md transition-colors"
                >
                    <PiUserCircleLight className='text-white text-3xl' />
                </Link>
                <button
                    ref={buttonRef}
                    onClick={handleDropdownClick}
                    className="p-1 hover:bg-app-bright-purple rounded-md transition-colors"
                    disabled={isLoading}
                >
                    <PiCaretDownLight className={`text-white text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Responsive positioned dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`sticky bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${isMobile ? 'w-64' : 'w-72'}`}
                    style={dropdownStyle}
                >
                    {/* Loading State */}
                    {isAuthenticated === null && (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-500">{t('loading')}</p>
                        </div>
                    )}

                    {/* Authenticated State */}
                    {isAuthenticated === true && (
                        <>
                            {/* Current Account Section */}
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {currentAccount && getAccountAvatar(currentAccount) ? (
                                            <img
                                                src={getAccountAvatar(currentAccount)}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <PiUserLight className="text-gray-400 text-xl" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate text-sm">
                                            {getAccountDisplayName(currentAccount)}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {getAccountSubtitle(currentAccount)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Switcher Section */}
                            {alternativeAccounts.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {t('switch_account')}
                                        </p>
                                    </div>
                                    <div>
                                        {alternativeAccounts.map((account) => (
                                            <button
                                                key={account.id}
                                                onClick={() => handleAccountSwitch(account.id)}
                                                disabled={isLoading}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {getAccountAvatar(account) ? (
                                                        <img
                                                            src={getAccountAvatar(account)}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : account.is_personal ? (
                                                        <PiUserLight className="text-gray-400 text-sm" />
                                                    ) : (
                                                        <PiStorefrontLight className="text-gray-400 text-sm" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate text-sm">
                                                        {getAccountDisplayName(account)}
                                                    </p>
                                                    {!account.is_personal && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {currentUser?.name ? `${currentUser.name} ${currentUser.last_name || ''}`.trim() : 'Store Owner'}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Menu Actions */}
                            <div className="border-t border-gray-100">
                                <Link
                                    href="/workspaces/profile"
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left text-sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <PiUserLight className="text-gray-500 text-lg flex-shrink-0" />
                                    <span className="text-gray-700">{t('profile_settings')}</span>
                                </Link>
                                <AuthLogoutButtonWidget />
                            </div>
                        </>
                    )}

                    {/* Unauthenticated State */}
                    {isAuthenticated === false && (
                        <>
                            <div className="p-4">
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    {t('signin_message')}
                                </p>
                                <div className="space-y-2">
                                    <Link
                                        href="/auth/login"
                                        className="w-full px-4 py-3 flex items-center justify-center gap-3 bg-app-bright-purple text-white rounded-md hover:bg-app-bright-purple-dark transition-colors text-sm font-medium"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <PiSignInLight className="text-lg flex-shrink-0" />
                                        <span>{t('sign_in')}</span>
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="w-full px-4 py-3 flex items-center justify-center gap-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <PiUserPlusLight className="text-lg flex-shrink-0" />
                                        <span>{t('sign_up')}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Logout Button Section */}
                            <div className="border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left text-red-600 text-sm disabled:opacity-50"
                                >
                                    <PiSignOutLight className="text-lg flex-shrink-0" />
                                    <span>{t('sign_out')}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default PublicProfileDropdownWidget; 