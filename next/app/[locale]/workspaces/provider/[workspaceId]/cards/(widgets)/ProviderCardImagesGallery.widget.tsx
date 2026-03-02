
"use client";

import { useState }
  from 'react';
import Image
  from 'next/image';

interface ProviderCardImagesGalleryWidgetProps {
  images: string[];
  id: string | number;
}

export function ProviderCardImagesGalleryWidget({ images, id }: ProviderCardImagesGalleryWidgetProps) {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const imageUrlPrefix = `${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/` + id + "/";

  return (
    <div className="flex flex-col items-center w-full md:w-1/2 lg:w-1/3">
      <div className="w-full h-48 relative rounded mb-2">
        <Image
          src={`${imageUrlPrefix}${images[currentImage]}`}
          alt="Card"
          fill
          style={{ objectFit: "contain" }}
          className="rounded"
        />
      </div>
      {images.length > 1 && (
        <div>
          <button onClick={prevImage} className="mr-2 bg-black text-sky-400 font-bold py-2 px-3 rounded-full">←</button>
          <button onClick={nextImage} className=' bg-black text-sky-400 font-bold py-2 px-3 rounded-full'>→</button>
        </div>
      )}
    </div>
  );
}
