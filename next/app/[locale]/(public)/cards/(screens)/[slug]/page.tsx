import { cache } from 'react';
import PublicSingleCardWidget from '@/app/[locale]/(public)/cards/(widgets)/PublicSingleCard.widget';
import { notFound } from 'next/navigation';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { ssrModules } from '@/lib/ssr/ssr-modules';

interface CardPageParams {
  slug: string;
  locale: string;
}

const getCardData = cache(async (slug: string) => {
  const lastHyphen = slug.lastIndexOf('-');

  if (lastHyphen === -1 || lastHyphen === slug.length - 1) {
    ConsoleLogger.error('Invalid card slug format:', slug);
    return null;
  }

  const id = slug.substring(lastHyphen + 1);
  try {
    return await ssrModules().cards.getPublicCard(id);
  } catch (error) {
    const err = error as Error;
    ConsoleLogger.error('Error fetching card:', err.message);
    return null;
  }
});

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<CardPageParams> }) {
  const { slug } = await params;

  const card = await getCardData(slug);

  if (!card) {
    return {
      title: 'Card Not Found',
      description: 'The requested card could not be found.'
    };
  }

  return {
    title: card.title,
    description: card.body,
    openGraph: {
      title: card.title,
      description: card.body,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: card.title,
      description: card.body,
    }
  };
}

const PublicCardPage = async ({ params }: { params: Promise<CardPageParams> }) => {
  const { slug, locale } = await params;

  if (!locale) {
    notFound();
  }

  const card = await getCardData(slug);

  if (!card) {
    notFound();
  }

  return <PublicSingleCardWidget card={card as any} />;
};

export default PublicCardPage;
