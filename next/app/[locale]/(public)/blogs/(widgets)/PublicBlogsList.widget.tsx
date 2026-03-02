"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBlogs, sanityImageUrl } from '@/lib/integrations/Cms.Sanity.read';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { SectionPrimitive } from '@/app/primitives/Section.primitive';

interface SanityBlog {
    _id: string;
    title?: string;
    slug?: { current: string };
    cover?: unknown;
    excerpt?: string;
    isActive?: boolean;
    _createdAt?: string;
}

export function PublicBlogsListWidget() {
    const [blogsList, setBlogsList] = useState<SanityBlog[]>([]);
    const locale = useLocale();

    useEffect(() => {
        fetchBlogs()
            .then(blogs => setBlogsList(blogs || []))
            .catch(err => ConsoleLogger.error('Error fetching blogs:', err));
    }, [locale]);

    return (
        <SectionPrimitive variant="centered">
            {blogsList.map((blog) => (
                <Link
                    key={blog._id}
                    href={'/blogs/' + (blog.slug?.current || blog._id)}
                    className='p-5 col-span-6 w-full'
                >
                    <div className="w-full grid grid-cols-12">
                        <div className="relative flex col-span-12 flex-col w-full p-20 justify-center items-start px-6 tracking-wide">
                            <Image
                                className='rounded-2xl'
                                style={{ objectFit: 'cover' }}
                                src={blog.cover ? sanityImageUrl(blog.cover).width(800).url() : '/pg.webp'}
                                fill
                                alt={blog.title || 'Blog title'}
                                onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
                            />
                        </div>
                        <div className="flex col-span-12 flex-col w-full justify-center items-start py-6 tracking-wide">
                            <p>{blog.title}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </SectionPrimitive>
    )
}
