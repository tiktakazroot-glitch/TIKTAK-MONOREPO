import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Fragment } from 'react';
import type { Category } from '@/app/[locale]/(public)/categories/PublicCategoriesService';
import { generateSlug } from '@/lib/utils/Formatter.Slugify.util';
import { lt } from '@/lib/utils/Localized.util';

interface PublicBreadCrumbsTileProps {
  categories: Category[];
}

export function PublicBreadCrumbsTile({ categories }: PublicBreadCrumbsTileProps) {

  const locale = useLocale();
  // Builds a linear hierarchy from the categories array
  const buildLinearHierarchy = (cats: Category[]): Category[] => {
    const hierarchy: Category[] = [];
    let currentCategory = cats.find(category => category.parentId == null);

    while (currentCategory) {
      hierarchy.push(currentCategory);
      const parentId = currentCategory.id;
      currentCategory = cats.find(category => category.parentId === parentId);
    }

    return hierarchy;
  };

  // Use the function to build the linear hierarchy from categories
  const linearHierarchy = buildLinearHierarchy(categories);

  return (
    <div className="flex overflow-x-auto no-scrollbar space-x-2 items-center">
      {linearHierarchy.map((category, index) => (
        <Fragment key={category.id}>
          <div>
            <div className="flex items-center space-x-1 relative rounded">
              <img
                src={`/categories/${category.id}/icon.svg`}
                alt=""
                className="h-10"
              />
              <Link href={`/categories/${generateSlug(lt(category.title))}-${category.id}c`} passHref locale={locale}>
                <span className="text-sm font-semibold text-gray-900/50 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer transition-colors whitespace-nowrap">
                  {lt(category.title)}
                </span>
              </Link>
            </div>
          </div>
          {index < linearHierarchy.length - 1 && (
            <span className="text-gray-400 dark:text-gray-600">/</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
