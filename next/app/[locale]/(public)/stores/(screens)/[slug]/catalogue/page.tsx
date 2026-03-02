import { cache } from 'react';
import { PublicStoreCatalogueWidget } from '@/app/[locale]/(public)/stores/(widgets)/PublicStoreCatalogue.widget';
import { notFound } from 'next/navigation';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { ssrModules } from '@/lib/ssr/ssr-modules';

// Cached data fetching function - prevents duplicate fetches
const getStoreData = cache(async (id: string) => {
  try {
    return await ssrModules().provider.get(id);
  } catch (error) {
    ConsoleLogger.error('Error fetching store:', error);
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const regex = /(\d+)$/;
  const match = slug.match(regex);
  const id = match ? match[0] : null;
  const store = id ? await getStoreData(id) : null;
  if (!store) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    };
  }
  return {
    title: (store?.title || 'Store') + ' - Catalogue',
  };
}

const StoreCataloguePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const regex = /(\d+)$/;
  const match = slug.match(regex);
  const id = match ? match[0] : null;

  if (!id) {
    notFound();
  }

  const store = await getStoreData(id);
  if (!store) {
    notFound();
  }
  return <PublicStoreCatalogueWidget store={store} />;
}

export default StoreCataloguePage;
