import { useState, useRef, useEffect } from 'react';
import { getOptimizedImageUrl, getImageFallbacks, getGoogleDriveFileId } from '../utils/imageFormatter';

// Global session memory cache for image URLs
const globalLoadedCache = new Set<string>();

export const isUrlInCache = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return globalLoadedCache.has(url);
};

export const markUrlAsCached = (url: string | undefined | null) => {
  if (url) globalLoadedCache.add(url);
};

// Find the highest resolution version of an image that is ALREADY cached in memory
export const getCachedPlaceholderUrl = (src: string | undefined | null, sizes: number[] = [1000, 600, 400, 250, 120]): string | null => {
  if (!src) return null;
  const isDriveUrl = Boolean(getGoogleDriveFileId(src));
  if (!isDriveUrl) return isUrlInCache(src) ? src : null;

  for (const size of sizes) {
    const url = getOptimizedImageUrl(src, size);
    if (globalLoadedCache.has(url)) {
      return url;
    }
  }
  return null;
};

interface DriveImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  priority?: boolean;
  maxSize?: number;     // Target high-res size (default 400 for cards, 1000 for detail/modal)
  initialSize?: number; // Low-res fast preview size (default 120 for instant ~2KB WebP)
}

export default function DriveImage({
  src,
  alt,
  className = '',
  style,
  onError,
  priority = false,
  maxSize = 400,
  initialSize = 120
}: DriveImageProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isDriveUrl = Boolean(getGoogleDriveFileId(src));

  // High-res target fallbacks
  const fallbacks = getImageFallbacks(src, maxSize);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const currentHighResUrl = fallbacks[fallbackIndex] || 'https://placehold.co/800x800?text=Product';

  // Compute low-res preview URL
  const computedLowResUrl = (isDriveUrl && maxSize > initialSize) ? getOptimizedImageUrl(src, initialSize) : null;
  
  // Check if any existing cached version (e.g. from card preview) can serve as an immediate placeholder
  const existingCachedPlaceholder = getCachedPlaceholderUrl(src, [1000, 600, 400, 250, 120]);
  const lowResUrl = existingCachedPlaceholder || computedLowResUrl;

  // Check initial cache status
  const isHighResCached = isUrlInCache(currentHighResUrl);
  const isLowResCached = lowResUrl ? isUrlInCache(lowResUrl) : false;

  // Viewport visibility state
  const [inView, setInView] = useState<boolean>(priority || isHighResCached || isLowResCached);
  
  // Progressive loading states
  const [lowResLoaded, setLowResLoaded] = useState<boolean>(isLowResCached || isHighResCached);
  const [highResLoaded, setHighResLoaded] = useState<boolean>(isHighResCached);
  
  // Trigger high-res load either when low-res finishes or immediately if cached/priority/no-lowres
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState<boolean>(
    isHighResCached || priority || !lowResUrl || isLowResCached
  );

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (inView) return;

    const element = containerRef.current;
    if (!element) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setInView(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '250px 0px' } // Preload 250px before entering screen
      );
      observer.observe(element);
      return () => observer.disconnect();
    } else {
      setInView(true);
    }
  }, [inView]);

  // Reset/sync states when src or sizes change
  useEffect(() => {
    setFallbackIndex(0);
    const highCached = isUrlInCache(currentHighResUrl);
    const lowCached = lowResUrl ? isUrlInCache(lowResUrl) : false;

    setHighResLoaded(highCached);
    setLowResLoaded(lowCached || highCached);
    setShouldLoadHighRes(highCached || priority || !lowResUrl || lowCached);

    if (highCached || lowCached || priority) {
      setInView(true);
    }
  }, [src, maxSize, initialSize, priority, currentHighResUrl, lowResUrl]);

  const showSkeleton = !lowResLoaded && !highResLoaded;

  return (
    <span ref={containerRef} className="relative flex items-center justify-center w-full h-full overflow-hidden bg-gray-50/50">
      {/* Shimmer Skeleton Placeholder while nothing is loaded */}
      {showSkeleton && (
        <span
          className="absolute inset-0 animate-shimmer z-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
          aria-hidden="true"
        />
      )}

      {/* Stage 1: Fast Low-Res / Cached Preview Image */}
      {inView && lowResUrl && !highResLoaded && (
        <img
          src={lowResUrl}
          alt={alt}
          style={style}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          className={`${className} absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none z-1 ${
            existingCachedPlaceholder ? 'filter blur-[1px]' : 'filter blur-[8px] scale-105'
          } ${lowResLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => {
            if (lowResUrl) markUrlAsCached(lowResUrl);
            setLowResLoaded(true);
            setShouldLoadHighRes(true); // Trigger Stage 2 high-res load
          }}
          onError={() => {
            setLowResLoaded(false);
            setShouldLoadHighRes(true); // Proceed directly to high-res on error
          }}
        />
      )}

      {/* Stage 2: Target Resolution Crisp Image (=w400-rw for grid cards, =w1000-rw for detail/lightbox) */}
      {inView && shouldLoadHighRes && (
        <img
          src={currentHighResUrl}
          alt={alt}
          style={style}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          className={`${className} transition-opacity duration-300 ease-out relative z-2 ${
            highResLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            markUrlAsCached(currentHighResUrl);
            setHighResLoaded(true);
            setLowResLoaded(true);
          }}
          onError={() => {
            if (fallbackIndex < fallbacks.length - 1) {
              setFallbackIndex((i) => i + 1);
            } else {
              setHighResLoaded(true);
              onError?.();
            }
          }}
        />
      )}
    </span>
  );
}
