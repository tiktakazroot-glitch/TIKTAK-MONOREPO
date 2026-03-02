'use client'

import { usePublicSearchContext } from '@/app/[locale]/(public)/(context)/PublicSearchContext';
import { useEffect } from 'react';
import { PublicCardsWithFiltersWidget } from '@/app/[locale]/(public)/cards/(widgets)/PublicCardsWithFilters.widget';
import { usePublicHeaderNavContext } from '@/app/[locale]/(public)/(context)/PublicHeaderNavContext';
import { Category } from '@/lib/domain/categories/Categories.types';
import { lt } from '@/lib/utils/Localized.util';

interface PublicCategoriesCatalogueWidgetsProps {
    category: Category.PublicAccess;
}

export function PublicCategoriesCatalogueWidgets({ category }: PublicCategoriesCatalogueWidgetsProps) {
    const { triggerInitialSearch, updateInitialProps } = usePublicSearchContext();
    const { setHeaderNav, resetHeaderNav } = usePublicHeaderNavContext();

    useEffect(() => {
        if (category?.id) {
            setHeaderNav({
                pageType: 'category',
                navData: {
                    category: {
                        id: category.id,
                        title: category.title,
                        slug: category.title?.az || category.title?.en || ''
                    }
                }
            });
        }
        return () => resetHeaderNav();
    }, [category?.id, setHeaderNav, resetHeaderNav]);

    useEffect(() => {
        if (category?.id) {
            updateInitialProps({
                categoryId: category.id,
                includeFacets: true,
                pagination: 50,
                useAdvancedFilters: false
            });

            // Small delay to allow config to settle, then trigger search
            const timeoutId = setTimeout(() => {
                triggerInitialSearch();
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [category?.id]); // Only depend on category.id to prevent unnecessary re-runs

    return (
        <>
            <PublicCardsWithFiltersWidget />
        </>
    );
}