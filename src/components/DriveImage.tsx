import { useState, useRef, useEffect } from 'react';
import { getImageFallbacks } from '../utils/imageFormatter';
import { LazyImage } from './LazyImage';

interface DriveImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  onError?: () => void;
  priority?: boolean;
}

export default function DriveImage({ src, alt, className = '', onError, priority = false }: DriveImageProps) {
  const fallbacks = getImageFallbacks(src);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states when source changes to allow fresh loading
  useEffect(() => {
    setIndex(0);
    setLoaded(priority);
  }, [src, priority]);

  // Check if image was cached or loaded synchronously
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, index]);

  return (
    <span className="relative flex items-center justify-center w-full h-full overflow-hidden">
      {/* Shimmer skeleton */}
      {!loaded && (
        <span
          className="absolute inset-0 animate-shimmer"
          aria-hidden="true"
        />
      )}
      <LazyImage
        ref={imgRef}
        src={fallbacks[index] || 'https://placehold.co/800x800?text=Product'}
        alt={alt}
        hero={priority}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => {
          if (index < fallbacks.length - 1) {
            setIndex(i => i + 1);
          } else {
            setLoaded(true); // show fallback/broken state anyway
            onError?.();
          }
        }}
        onLoad={() => setLoaded(true)}
      />
    </span>
  );
}
