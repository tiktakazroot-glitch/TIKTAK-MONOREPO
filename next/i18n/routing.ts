import {
    defineRouting
} from 'next-intl/routing';
import {
    createNavigation
} from 'next-intl/navigation';

export const routing = defineRouting({
    locales: ['az', 'ru', 'en'],
    defaultLocale: 'az',
    localePrefix: 'as-needed',
    localeDetection: false

});

export const {
    Link,
    redirect,
    usePathname,
    useRouter,
    getPathname
} = createNavigation(routing);

