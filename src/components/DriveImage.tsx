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

  // If image was already cached and loaded synchronously
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  // Reset states when source changes to allow fresh loading/shimmer transitions
  useEffect(() => {
    setIndex(0);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(priority);
    }
  }, [src]);

  useEffect(() => {
    if (priority) {
      setLoaded(true);
    }
  }, [priority]);

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
        src={fallbacks[index]}
        alt={alt}
        hero={priority}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => {
          if (index < fallbacks.length - 1) {
            setIndex(i => i + 1);
          } else {
            setLoaded(true); // show broken state anyway
            onError?.();
          }
        }}
        onLoad={() => setLoaded(true)}
      />
    </span>
  );
}
