'use client'

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import {
    useState,
    useEffect,
    useRef
} from 'react';
import { Link }
    from '@/i18n/routing';
import Image
    from 'next/image';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import {
    PiMagnifyingGlassLight,
    PiXCircleLight
} from "react-icons/pi";
import { loadClientSideCoLocatedTranslations }
    from '@/i18n/i18nClientSide';
import { generateSlug }
    from '@/lib/utils/Formatter.Slugify.util';

interface PublicSearchWidgetProps {
    hideOnCardFilters?: boolean;
}

export function PublicSearchWidget({ hideOnCardFilters = false }: PublicSearchWidgetProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false); // State to manage visibility

    // Hide search if CardsWithFilters is on the page
    if (hideOnCardFilters) {
        return null;
    }

    const { t } = loadClientSideCoLocatedTranslations('PublicSearchWidget');

    // Debounce ref for managing timeout
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSearchResults = async (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        try {
            const params: any = {
                searchText: query,
                limit: 5
            };

            // Add city filter if selected
            if (selectedCity) {
                params.cityId = selectedCity;
            }

            const response = await apiCall({
                method: 'GET',
                url: '/api/cards/search',
                params,
                body: {}
            });

            // Fix: Use response.data instead of response.json()
            const data = response.data;
            setSearchResults(data.cards || []);
        } catch (error) {
            ConsoleLogger.error('Error fetching search results:', error);
            setSearchResults([]);
        }
    };

    // Debounced search function
    const debouncedSearch = (query: string) => {
        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout for 300ms delay
        debounceTimeoutRef.current = setTimeout(() => {
            fetchSearchResults(query);
        }, 800);
    };

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await apiCall({ method: 'GET', url: '/api/cities', params: {}, body: {} });

                const data = response.data.cities;
                setCities(data);
            } catch (error) {
                ConsoleLogger.error('Error fetching cities:', error);
            }
        };

        fetchCities();
    }, []);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    // Clear search function
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        // Clear any pending debounced search
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="ml-4 flex items-center relative">
            {/* Mobile - toggle button only */}
            <div className="md:hidden">
                <button
                    className=""
                    onClick={() => setIsSearchVisible(!isSearchVisible)}
                >
                    {!isSearchVisible ? (
                        <PiMagnifyingGlassLight className='text-gray-900 text-2xl' />
                    ) : (
                        <PiXCircleLight className='text-gray-900 text-2xl' />
                    )}
                </button>
            </div>

            {/* Mobile search overlay - full header width with dropdown results */}
            {isSearchVisible && (
                <div className="md:hidden fixed top-0 left-0 right-0 bg-app-bright-purple/10/60 z-30">
                    <div className="flex items-center gap-2 px-4 py-3">
                        <div className="flex-1 relative">
                            <input
                                className='w-full px-3 py-2 pr-10 bg-white rounded text-sm text-gray-900 placeholder:text-gray-500'
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder={t('search_cards_placeholder')}
                                autoFocus
                            />
                            {/* Clear search button - only show when there's text */}
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <PiXCircleLight className="text-lg" />
                                </button>
                            )}
                        </div>
                        <select
                            className="w-24 px-2 py-2 rounded text-sm bg-white text-gray-900"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">{t('all')}</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>{city.title}</option>
                            ))}
                        </select>
                        <button className="" onClick={() => setIsSearchVisible(false)}>
                            <PiXCircleLight className='text-gray-900 text-xl' />
                        </button>
                    </div>

                    {/* Mobile search results dropdown */}
                    {searchQuery && searchResults.length > 0 && (
                        <div className="bg-white mx-4 mb-4 rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                            <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                                    {searchResults.length === 1
                                        ? t('results_found_single', { count: searchResults.length })
                                        : t('results_found_plural', { count: searchResults.length })}
                                </div>
                                <div className="space-y-1">
                                    {searchResults.map((result: any) => {
                                        const title = result._source?.title || result.title || 'card';
                                        const id = result._source?.id || result.id;
                                        const slug = generateSlug(title);

                                        return (
                                            <Link
                                                key={id}
                                                href={`/cards/${slug}-${id}`}
                                                className="block p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                                                onClick={() => setIsSearchVisible(false)}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Card Image */}
                                                    <div className="flex-shrink-0">
                                                        {(result._source?.images?.[0] || result.images?.[0]) ? (
                                                            <Image
                                                                src={process.env.NEXT_PUBLIC_S3_PREFIX + `/cards/${result._source?.storage_prefix || result.storage_prefix}/${result._source?.images?.[0] || result.images?.[0]}`}
                                                                alt={result._source?.title || result.title}
                                                                width={64}
                                                                height={64}
                                                                className="h-16 w-16 object-cover rounded-md"
                                                                onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                                                                <PiMagnifyingGlassLight className="text-gray-400 text-xl" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                            {result._source?.title || result.title}
                                                        </h3>

                                                        {(result._source?.price || result.price) && (
                                                            <p className="text-sm font-bold text-blue-600 mt-1">
                                                                ${result._source?.price || result.price}
                                                            </p>
                                                        )}

                                                        {(result._source?.body || result.body) && (
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                {result._source?.body || result.body}
                                                            </p>
                                                        )}

                                                        {/* Location if available */}
                                                        {(result._source?.location?.lat && result._source?.location?.lon) && (
                                                            <div className="flex items-center mt-1 text-xs text-gray-500">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                {t('location_available')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile - No results message */}
                    {searchQuery && searchResults.length === 0 && (
                        <div className="bg-white mx-4 mb-4 rounded-lg shadow-xl border border-gray-200 p-4">
                            <div className="text-center text-gray-500">
                                <PiMagnifyingGlassLight className="text-3xl mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">{t('no_results_for', { query: searchQuery })}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop search - always visible on desktop */}
            <div className="hidden md:flex items-center gap-4 relative">
                <div className="relative">
                    <input
                        className='w-80 px-5 py-2 pr-12 bg-app-bright-purple/10/60 rounded text-lg text-gray-900 placeholder:text-gray-900 placeholder-opacity-100'
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder={t('search_cards_placeholder')}
                    />
                    {/* Clear search button - only show when there's text */}
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-900 hover:text-gray-600 transition-colors"
                        >
                            <PiXCircleLight className="text-lg" />
                        </button>
                    )}
                </div>
                <select
                    className="w-40 px-2 py-2.5  rounded text-lg bg-app-bright-purple/10/60 text-gray-900"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                >
                    <option value="">{t('all_cities')}</option>
                    {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.title}</option>
                    ))}
                </select>

                {/* Desktop Search results dropdown */}
                {searchQuery && searchResults.length > 0 && (
                    <div className="absolute bg-white rounded-lg mt-2 z-50 w-96 top-full left-0 shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                        <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                                {searchResults.length === 1
                                    ? t('results_found_single', { count: searchResults.length })
                                    : t('results_found_plural', { count: searchResults.length })}
                            </div>
                            <div className="space-y-1">
                                {searchResults.map((result: any) => {
                                    const title = result._source?.title || result.title || 'card';
                                    const id = result._source?.id || result.id;
                                    const slug = generateSlug(title);

                                    return (
                                        <Link
                                            key={id}
                                            href={`/cards/${slug}-${id}`}
                                            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                                        >
                                            <div className="flex gap-3">
                                                {/* Card Image */}
                                                <div className="flex-shrink-0">
                                                    {(result._source?.images?.[0] || result.images?.[0]) ? (
                                                        <Image
                                                            src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/${result._source?.storage_prefix || result.storage_prefix}/${result._source?.images?.[0] || result.images?.[0]}`}
                                                            alt={result._source?.title || result.title}
                                                            width={64}
                                                            height={64}
                                                            className="h-16 w-16 object-cover rounded-md"
                                                            onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                                                        />
                                                    ) : (
                                                        <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                                                            <PiMagnifyingGlassLight className="text-gray-400 text-xl" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                        {result._source?.title || result.title}
                                                    </h3>

                                                    {(result._source?.price || result.price) && (
                                                        <p className="text-sm font-bold text-blue-600 mt-1">
                                                            ${result._source?.price || result.price}
                                                        </p>
                                                    )}

                                                    {(result._source?.body || result.body) && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {result._source?.body || result.body}
                                                        </p>
                                                    )}

                                                    {/* Location if available */}
                                                    {(result._source?.location?.lat && result._source?.location?.lon) && (
                                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {t('location_available')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop - No results message */}
                {searchQuery && searchResults.length === 0 && (
                    <div className="absolute bg-white rounded-lg mt-2 z-50 w-96 top-full left-0 shadow-xl border border-gray-200 p-4">
                        <div className="text-center text-gray-500">
                            <PiMagnifyingGlassLight className="text-3xl mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">{t('no_results_for', { query: searchQuery })}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
