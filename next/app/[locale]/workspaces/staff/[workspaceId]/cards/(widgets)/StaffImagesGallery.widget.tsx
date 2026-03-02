
"use client";

import { useState }
  from 'react';
import Image
  from 'next/image';

export default function StaffImagesGalleryWidget({ images, storage_prefix = 'cards' }: { images: string[], storage_prefix?: string }) {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const imageUrlPrefix = `${process.env.NEXT_PUBLIC_S3_PREFIX}/cards/` + storage_prefix + "/";

  return (
    <div className="flex flex-col items-center w-full md:max-w-[200px] lg:max-w-[300px] pl-4">
      <div className="w-full relative rounded mb-2 aspect-3/4">
        <Image
          src={`${imageUrlPrefix}${images[currentImage]}`}
          alt="Card"
          fill
          style={{ objectFit: "cover" }}
          className="rounded"
        />
      </div>
      {images.length > 1 && (
        <div>
          <button onClick={prevImage} className="mr-2 bg-app-bright-purple text-gray-900 hover:bg-app-bright-purple/80 font-bold py-2 px-3 rounded-full">←</button>
          <button onClick={nextImage} className=' bg-app-bright-purple text-gray-900 hover:bg-app-bright-purple/80 font-bold py-2 px-3 rounded-full'>→</button>
        </div>
      )}
    </div>
  );
}
