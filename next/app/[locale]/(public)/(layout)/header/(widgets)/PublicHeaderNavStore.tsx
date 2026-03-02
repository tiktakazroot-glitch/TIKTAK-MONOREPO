'use client';

import { useState }
  from 'react';
import { NavData } from '@/app/[locale]/(public)/(context)/PublicHeaderNavContext';
import Image
  from 'next/image';
import { loadClientSideCoLocatedTranslations }
  from '@/i18n/i18nClientSide';
import {
  PiArrowLeftLight,
  PiPhoneLight,
  PiMagnifyingGlassLight,
  PiFunnelLight,
  PiSortAscendingLight
} from "react-icons/pi";
import { Link }
  from '@/i18n/routing';
import { PublicHeaderSearchFiltersModalWidget }
  from '@/app/[locale]/(public)/(layout)/header/(widgets)/PublicHeaderSearchFiltersModal.widget';
import { generateSlug }
  from '@/lib/utils/Formatter.Slugify.util';

export function PublicHeaderNavStore({ navData, isCataloguePage }: { navData: NavData; isCataloguePage: boolean }) {
  const { t } = loadClientSideCoLocatedTranslations('PublicHeaderNavStore');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const storeLogo = navData?.logo
    ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${navData.id}/${navData.logo}`
    : '/pg.webp';

  // Generate slug on-the-fly from store title
  const storeSlug = generateSlug(navData?.store?.title || 'store');

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-1 text-gray-900 hover:text-gray-600 focus:outline-none bg-app-bright-purple/10 rounded-md p-2"
      >
        <PiArrowLeftLight className='text-gray-900 text-3xl' />
      </button>

      {!isCataloguePage && navData?.store?.id ? (
        <Link href={`/stores/${storeSlug}-${navData.store.id}/catalogue`} className="font-semibold text-gray-900 text-sm truncate max-w-[120px] sm:max-w-[200px]">
          {t('catalogue')}
        </Link>
      ) : (
        <>
          {/* Store Info */}
          < div className="flex items-center gap-2 overflow-hidden">
            {navData?.id && (
              <div className="relative flex aspect-square w-10 h-10">
                <Image
                  src={storeLogo}
                  alt={navData?.title || 'Store'}
                  fill
                  className="rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                />
              </div>
            )}
            {navData?.title && (
              <span className="font-semibold text-gray-900 text-sm truncate max-w-[120px] sm:max-w-[200px]">
                {navData.title}
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Contact Button */}
          {navData?.phone && (
            <a
              href={`tel:${navData.phone}`}
              className="inline-flex items-center gap-1 text-gray-900 hover:text-gray-600 bg-app-bright-purple/10 rounded-md p-2"
            >
              <PiPhoneLight className='text-gray-900 text-2xl' />
              <span className='hidden sm:flex no-wrap flex-nowrap whitespace-nowrap text-gray-900 text-sm'>
                {t('call')}
              </span>
            </a>
          )}

          {/* Search/Filter/Sort Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-gray-900 hover:text-gray-600 bg-app-bright-purple/10 rounded-md p-2"
            aria-label={t('search_filter_sort')}
          >
            <PiMagnifyingGlassLight className='text-gray-900 text-xl' />
            <PiFunnelLight className='text-gray-900 text-xl' />
            <PiSortAscendingLight className='text-gray-900 text-xl' />
          </button>

          {/* Search Filters Modal */}
          <PublicHeaderSearchFiltersModalWidget
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}

