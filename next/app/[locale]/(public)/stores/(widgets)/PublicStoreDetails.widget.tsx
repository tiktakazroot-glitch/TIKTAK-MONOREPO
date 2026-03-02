"use client";

import Image
  from 'next/image';
import { usePublicSearchContext }
  from '@/app/[locale]/(public)/(context)/PublicSearchContext';
import { usePublicHeaderNavContext }
  from '@/app/[locale]/(public)/(context)/PublicHeaderNavContext';
import { useEffect } from 'react';
import { PublicCardsWithFiltersWidget }
  from '@/app/[locale]/(public)/cards/(widgets)/PublicCardsWithFilters.widget';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { SectionPrimitive } from '@/app/primitives/Section.primitive';

// Store is a provider-type workspace with public-facing fields
interface Store {
  id: string;
  title?: string;
  description?: string;
  logo?: string;
  cover?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface PublicStoreDetailsApiResponse extends Store {
  // additional fields the API may include
}

interface PublicStoreDetailsWidgetProps {
  store: PublicStoreDetailsApiResponse;
}

const PublicStoreDetailsWidget = ({ store }: PublicStoreDetailsWidgetProps) => {
  const { updateInitialProps, triggerInitialSearch } = usePublicSearchContext();
  const { setHeaderNav, resetHeaderNav } = usePublicHeaderNavContext();

  // Set header nav for store page
  useEffect(() => {
    if (store) {
      setHeaderNav({
        pageType: 'store',
        navData: {
          store: {
            id: store.id,
            title: store.title,
            logo: store.logo,
            phone: store.phone
          }
        }
      });
    }
    return () => resetHeaderNav();
  }, [store, setHeaderNav, resetHeaderNav]);

  // Configure search context for this store
  useEffect(() => {
    ConsoleLogger.log('🏪 Configuring search context for store:', store.id);

    // Set initial props (persistent, never cleared)
    updateInitialProps({
      workspaceId: store.id ? String(store.id) : null,
      includeFacets: true,
      pagination: 50,
      useAdvancedFilters: false
    });

    // Small delay to allow config to settle, then trigger search
    const timeoutId = setTimeout(() => {
      triggerInitialSearch();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [store.id]);

  if (!store) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SectionPrimitive variant="centered">
        <div className="text-left">
          {/* Avatar */}
          <div className='relative w-full aspect-2/1 md:aspect-3/1 lg:aspect-4/1 xl:aspect-5/1  flex items-center'>
            <div className='absolute w-full top-0 z-2 h-full'>
              <Image
                src={store?.cover ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${store.id}/${store.cover}` : '/pg.webp'}
                alt="Store cover"
                fill
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
              />
            </div>
            <div className='absolute left-4 w-36 h-36 flex items-center z-3'>
              <Image
                src={store?.logo ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${store.id}/${store.logo}` : '/pg.webp'}
                alt="Store logo"
                fill
                className="rounded-full object-cover border-2 border-white"
                onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
              />
            </div>
          </div>
          {/* Name with Edit/Save Icon */}
          <div className="mt-4 flex items-center">
            <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" >
              {store.title}
            </h1>
          </div>
          {/* Phone Number with Edit/Save Icon */}
          <div className="mt-6 flex items-center">
            <p className="text-md text-gray-800 cursor-pointer">
              Phone: {store.phone}
            </p>
          </div>
          <div className='mt-6'>
            <p className="text-md text-gray-800 cursor-pointer">
              {store.description}
            </p>
          </div>

          {/* Links */}
        </div>
      </SectionPrimitive>

      <PublicCardsWithFiltersWidget showTitle={false} showResultsCount={true} />
    </>
  );
}

export default PublicStoreDetailsWidget;
