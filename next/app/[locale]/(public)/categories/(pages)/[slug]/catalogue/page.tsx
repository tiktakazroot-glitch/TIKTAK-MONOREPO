import { cache } from 'react';
import { PublicCategoriesCatalogueWidgets } from '@/app/[locale]/(public)/categories/(widgets)/PublicCategoriesCatalogueWidgets';
import { notFound } from 'next/navigation';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { ssrModules } from '@/lib/ssr/ssr-modules';

interface CategoryPageParams {
    slug: string;
    locale: string;
}

// Helper function to extract ID from slug (e.g. "some-category-name-123" → "123")
const extractIdFromSlug = (slug: string): string | null => {
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen === -1 || lastHyphen === slug.length - 1) return null;
    return slug.substring(lastHyphen + 1);
};

const getCategoryData = cache(async (id: string) => {
    try {
        return await ssrModules().categories.getCategoryById(id);
    } catch (error) {
        const err = error as Error;
        ConsoleLogger.error('Error fetching category:', err.message);
        return null;
    }
});

// Helper to extract localized title string
const getLocalizedTitle = (title: any, fallback = 'Category'): string => {
    if (!title) return fallback;
    if (typeof title === 'string') return title;
    return title.az || title.en || title.ru || fallback;
};

export async function generateMetadata({ params }: { params: Promise<CategoryPageParams> }) {
    const { slug } = await params;
    const id = extractIdFromSlug(slug);
    const category = id ? await getCategoryData(id) : null;
    return {
        title: (category ? getLocalizedTitle(category.title) : 'Category') + ' - Catalogue',
    };
}

const CategoryCataloguePage = async ({ params }: { params: Promise<CategoryPageParams> }) => {
    const { slug } = await params;
    const id = extractIdFromSlug(slug);

    if (!id) {
        notFound();
    }

    const category = await getCategoryData(id);

    if (!category) {
        notFound();
    }

    return <PublicCategoriesCatalogueWidgets category={category} />;
}

export default CategoryCataloguePage;