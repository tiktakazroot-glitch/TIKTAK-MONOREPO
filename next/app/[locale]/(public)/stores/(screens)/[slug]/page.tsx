import { ConsoleLogger } from '@/lib/logging/Console.logger';
import PublicStoreDetailsWidget
  from '@/app/[locale]/(public)/stores/(widgets)/PublicStoreDetails.widget';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ssrModules } from '@/lib/ssr/ssr-modules';

// Cached data fetching function
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

  if (!id) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    };
  }

  const store = await getStoreData(id);

  if (!store) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    };
  }

  return {
    title: store.title,
    description: store.description,
    openGraph: {
      title: store.title,
      description: store.description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/stores/${slug}`,
    },
  };
}

const PublicStoreDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
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

  return <PublicStoreDetailsWidget store={store} />;
};

export default PublicStoreDetailsPage;
