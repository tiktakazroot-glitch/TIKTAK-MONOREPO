"use client";

import Image
    from "next/image";
import { Link }
    from '@/i18n/routing';
import { generateSlug }
    from '@/lib/utils/Formatter.Slugify.util';
/** Provider workspace public profile shape returned by /api/stores */
export interface ProviderPublicProfile {
    id: string;
    title?: string;
    cover?: string;
    logo?: string;
    [key: string]: unknown;
}



interface PublicStoresListItemWidgetProps {
    store: ProviderPublicProfile;
}

export function PublicStoresListItemWidget({ store }: PublicStoresListItemWidgetProps) {
    // Generate slug on-the-fly from title
    const slug = generateSlug(store.title || 'store');

    const coverSrc = store?.cover
        ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${store.id}/${store.cover}`
        : '/pg.webp';

    const logoSrc = store?.logo
        ? `${process.env.NEXT_PUBLIC_S3_PREFIX}/stores/${store.id}/${store.logo}`
        : '/pg.webp';

    return (
        <Link href={`/stores/${slug}-${store.id}`} className="relative w-full aspect-[2/1] rounded overflow-hidden bg-white">
            <Image
                src={coverSrc}
                alt={store.title ?? 'store cover'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                className="rounded-xl"
            />
            <div className="relative flex items-center justify-center w-full h-full">
                <Image
                    src={logoSrc}
                    alt={store.title ?? 'store logo'}
                    width={70}
                    height={70}
                    className="aspect-square rounded-full z-[2] border-2 border-white"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black opacity-50 z-[1] rounded-xl">
                </div>
            </div>
            <h3 className="text-white text-xl font-bold absolute bottom-0 left-0 w-full p-2 text-center z-[2]">{store.title}</h3>
        </Link>
    )
}
