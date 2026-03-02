"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchBlogBySlug, sanityImageUrl } from '@/lib/integrations/Cms.Sanity.read';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { SectionPrimitive } from '@/app/primitives/Section.primitive';

interface SanityBlog {
  _id: string;
  title?: string;
  slug?: { current: string };
  cover?: unknown;
  content?: string;
  body?: unknown[];
  _createdAt?: string;
}

export function PublicSingleBlogWidget() {
  const [blog, setBlog] = useState<SanityBlog | null>(null);
  const locale = useLocale();
  const params = useParams();

  const slug = (params?.slug as string) || '';

  useEffect(() => {
    if (!slug) return;

    fetchBlogBySlug(slug)
      .then(data => { if (data) setBlog(data); })
      .catch(err => ConsoleLogger.error('Error fetching blog:', err));
  }, [locale, slug]);

  if (!blog) return null;

  return (
    <SectionPrimitive variant='centered'>
      <div className="w-1/2 flex flex-wrap justify-center max-w-3xl my-20 text-white shadow-md rounded-md">
        {!!blog.cover && (
          <div className='relative w-full p-20'>
            <Image
              style={{ objectFit: 'cover' }}
              src={sanityImageUrl(blog.cover).width(1200).url()}
              fill
              alt={blog.title || 'Blog title'}
              onError={(e) => { e.currentTarget.src = '/pg.webp'; }}
            />
          </div>
        )}
        <h1 className="text-black dark:text-white w-full text-start p-5 text-xl font-bold mb-4">
          {blog.title}
        </h1>
        {blog.content && (
          <div className='w-full text-black dark:text-white p-5' dangerouslySetInnerHTML={{ __html: blog.content }}>
          </div>
        )}
      </div>
    </SectionPrimitive>
  );
}