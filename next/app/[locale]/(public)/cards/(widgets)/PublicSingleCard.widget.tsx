'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbs.tile';
import { PublicAddCardToFavoritesWidget } from '@/app/[locale]/(public)/cards/(widgets)/PublicAddCardToFavorites.widget';
import { PublicMessageButtonTile } from '@/app/[locale]/(public)/cards/(tiles)/PublicMessageButton.tile';
import { PublicSingleMarkerMapWidget } from '@/app/[locale]/(public)/(widgets)/PublicSingleMarkerMap.widget';

// Import the Location type from the map widget to avoid conflicts
type MapLocation = { lat: number; lng: number };
import { Link } from '@/i18n/routing';
import { PublicCardGalleryWidget } from '@/app/[locale]/(public)/cards/(widgets)/PublicCardGallery.widget';
import { PublicRelatedCardsWidget } from '@/app/[locale]/(public)/cards/(widgets)/PublicRelatedCards.widget';
import { useGlobalCategoryContext } from '@/app/[locale]/(global)/(context)/GlobalCategoryContext';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalVideoPlayerWidget } from '@/app/[locale]/(global)/(widgets)/GlobalVideoPlayer.widget';
import { usePublicHeaderNavContext } from '@/app/[locale]/(public)/(context)/PublicHeaderNavContext';
import type { Category } from '@/app/[locale]/(public)/categories/PublicCategoriesService';
import { generateSlug } from '@/lib/utils/Formatter.Slugify.util';

type LocalizedTitle = { az?: string; en?: string; ru?: string } | string;

interface FilterGroup {
  id: string;
  title: LocalizedTitle;
  type: string;
  category_id: string;
  options: Array<{ id: string; title: LocalizedTitle }>;
}

interface CardFilterOption {
  type: 'STATIC' | 'DYNAMIC';
  option_id?: string;
  option_group_id?: string;
  dynamic_value?: string;
}

import type { Card } from '@tiktak/shared/types/domain/Card.types';

import { ContainerPrimitive } from '@/app/primitives/Container.primitive';
import { SectionPrimitive } from '@/app/primitives/Section.primitive';
import { BlockPrimitive } from '@/app/primitives/Block.primitive';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { lt } from '@/lib/utils/Localized.util';
// Single card API response — extends shared Card.PublicAccess (all camelCase)
type PublicSingleCardApiResponse = Card.PublicAccess & {
  workspace?: { id: string; title: string; logo?: string | null; phone?: string | null } | null;
  accounts?: { name?: string | null; phone?: string | null } | null;
};

interface PublicSingleCardWidgetProps {
  card: PublicSingleCardApiResponse;
}

const PublicSingleCardWidget = ({ card }: PublicSingleCardWidgetProps) => {
  const { categoriesHierarchy } = useGlobalCategoryContext();
  const { setHeaderNav, resetHeaderNav } = usePublicHeaderNavContext();
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  ConsoleLogger.log(card);
  if (!card) {
    return <div>Loading...</div>;
  }

  // Set header nav for card page
  useEffect(() => {
    if (card) {
      // Find the first category to display in the header
      const primaryCategory = card.categories && card.categories.length > 0 && card.categories[0] !== undefined
        ? findCategoryById(categoriesHierarchy, card.categories[0])
        : null;

      setHeaderNav({
        pageType: 'card',
        navData: {
          title: card.title ?? undefined,
          category: primaryCategory
            ? { id: primaryCategory.id, title: primaryCategory.title }
            : null
        }
      });
    }
    return () => resetHeaderNav();
  }, [card, categoriesHierarchy, setHeaderNav, resetHeaderNav]);

  // Fetch options when card categories change
  useEffect(() => {
    if (card && card.categories && card.categories.length > 0) {
      fetchFiltersForCategories(card.categories);
    }
  }, [card]);

  const fetchFiltersForCategories = async (categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return;

    setLoadingFilters(true);
    try {
      const response = await apiCall({
        method: 'GET',
        url: `/api/category/filters?categories=${categoryIds.join(',')}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        const data = response.data?.data || response.data;
        setFilterGroups(data.filters || []);
      } else {
        ConsoleLogger.error('Error fetching filters:', response.data?.error);
        setFilterGroups([]);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching filters:', error);
      setFilterGroups([]);
    }
    setLoadingFilters(false);
  };

  // Function to find category by ID from the hierarchy
  const findCategoryById = (categories: Category[], id: string): Category | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Map category IDs from card.categories to full ancestor path for breadcrumbs
  const mapCategoriesToObjects = (): Category[] => {
    if (!card.categories || !Array.isArray(card.categories) || categoriesHierarchy.length === 0) {
      return [];
    }

    // Build a flat lookup map: id → category with parentId
    const flatMap = new Map<string, Category>();
    const buildFlatMap = (cats: Category[], parentId: string | null) => {
      for (const cat of cats) {
        flatMap.set(cat.id, { ...cat, parentId });
        if (cat.children && cat.children.length > 0) {
          buildFlatMap(cat.children, cat.id);
        }
      }
    };
    buildFlatMap(categoriesHierarchy, null);

    // For the first category on the card, walk up to build [root, ..., leaf]
    const leafId = card.categories[0];
    if (!leafId) return [];

    const path: Category[] = [];
    let current = flatMap.get(leafId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? flatMap.get(current.parentId) : undefined;
    }

    return path;
  };

  // Function to find option details by option ID
  // Find an option across all filter groups by its ID
  const findOptionById = (optionId: string) => {
    for (const group of filterGroups) {
      const option = group.options.find(opt => opt.id === optionId);
      if (option) return { option, group };
    }
    return null;
  };

  // Find a filter group by ID
  const findFilterGroupById = (groupId: string) => {
    return filterGroups.find(group => group.id === groupId) || null;
  };

  // Render the card's filter options
  const cardFilters = card.filtersOptions || [];

  const renderFilters = () => {
    if (!cardFilters || cardFilters.length === 0) return null;

    if (loadingFilters) {
      return (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-app-dark-purple rounded"></div>
          <div className="h-4 bg-gray-100 dark:bg-app-dark-purple rounded w-3/4"></div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {cardFilters.map((filterOpt: CardFilterOption, index: number) => {
          const details = filterOpt.option_id ? findOptionById(filterOpt.option_id) : null;
          const group = filterOpt.option_group_id ? findFilterGroupById(filterOpt.option_group_id) : null;

          const groupTitle = details ? lt(details.group.title) : group ? lt(group.title) : null;
          const optionTitle = filterOpt.type === 'DYNAMIC'
            ? filterOpt.dynamic_value
            : details ? lt(details.option.title) : null;

          if (!groupTitle && !optionTitle) return null;

          return (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">{groupTitle || '—'}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{optionTitle || '—'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const mappedCategories = mapCategoriesToObjects();

  return (
    <>
      <SectionPrimitive variant='centered'>
        <PublicBreadCrumbsTile categories={mappedCategories} />
      </SectionPrimitive>
      <SectionPrimitive variant='centered'>
        {/* ═══ ROW 1: Gallery + Provider Info (2 cols desktop, 1 col mobile) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* LEFT: Gallery + Video */}
          <div className="w-full">
            <PublicCardGalleryWidget card={card} />

            {card.video?.url && card.workspaceId && (
              <div className="mt-4 w-full">
                <GlobalVideoPlayerWidget
                  videoFileName={card.video.url}
                  controls={true}
                  muted={false}
                  poster={card.cover ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/${card.workspaceId}/${card.id}/${card.cover}` : undefined}
                  className="w-full rounded-lg overflow-hidden"
                />
              </div>
            )}
          </div>

          {/* RIGHT: Title + Price + Provider + Actions */}
          <div className="w-full flex flex-col gap-4">
            {/* Title + Price */}
            <div>
              <h1 className="text-2xl font-bold">{card.title || 'No Title'}</h1>
              {card.price != null && (
                <p className="text-xl font-semibold text-brand mt-2">{card.price} AZN</p>
              )}
            </div>

            {/* Store / Account Info + Actions */}
            <BlockPrimitive variant="elevated">
              {card.workspace?.id ? (
                <div className="mb-4">
                  <div className="flex gap-4 items-center">
                    <Link href={`/stores/${generateSlug(card.workspace.title || 'store')}-${card.workspace.id}`}>
                      <Image
                        className="rounded-full object-cover aspect-square border-2 border-app-bright-purple/20"
                        width={50}
                        height={50}
                        src={card.workspace.logo ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${card.workspace.id}/${card.workspace.logo}` : '/pg.webp'}
                        alt={card.workspace.title || 'Store'}
                        onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                      />
                    </Link>
                    <div className="flex flex-col justify-center">
                      <span className="font-extrabold text-app-dark-purple dark:text-white">{card.workspace.title}</span>
                      {card.workspace.phone && (
                        <span className="text-sm text-gray-500">{card.workspace.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : card.accounts?.name ? (
                <div className="mb-4">
                  <span className="block font-bold text-app-dark-purple dark:text-white">{card.accounts.name}</span>
                  {card.accounts.phone && (
                    <span className="block text-gray-500 text-sm">{card.accounts.phone}</span>
                  )}
                </div>
              ) : null}

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PublicAddCardToFavoritesWidget cardId={card.id} className="relative" />
                <PublicMessageButtonTile
                  cardId={card.id}
                  cardTitle={card.title || ''}
                  accountId={card.accountId ?? undefined}
                />
              </div>
            </BlockPrimitive>
          </div>
        </div>
      </SectionPrimitive>

      {/* ═══ ROW 2: Description + Filters + Map (full width) ═══ */}
      <SectionPrimitive variant='centered'>
        <div className="flex flex-col gap-6">
          {/* Description */}
          {card.body && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Təsvir</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{card.body}</p>
            </div>
          )}

          {/* Filters / Specifications */}
          {cardFilters.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Xüsusiyyətlər</h2>
              {renderFilters()}
            </div>
          )}

          {/* Map */}
          {card.location && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Xəritə</h2>
              <PublicSingleMarkerMapWidget location={card.location as unknown as MapLocation | null} />
            </div>
          )}
        </div>
      </SectionPrimitive>

      {/* ═══ ROW 3: Related Cards ═══ */}
      <PublicRelatedCardsWidget categoryId={card.categories && card.categories.length > 0 ? (card.categories[0] || null) : null} />
    </>
  );
};

export default PublicSingleCardWidget;
