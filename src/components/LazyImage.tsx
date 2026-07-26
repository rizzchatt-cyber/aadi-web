import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  hero?: boolean;
}

export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(({
  src,
  alt,
  width,
  height,
  className = '',
  hero = false,
  ...props
}, forwardedRef) => {
  const [isLoaded, setIsLoaded] = useState(hero);
  const internalRef = useRef<HTMLImageElement>(null);

  // Merge refs so both IntersectionObserver and parent can access the DOM node
  const setRefs = (node: HTMLImageElement) => {
    internalRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const getOptimizedSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url; // Don't proxy data URIs

    let absoluteUrl = url;
    if (url.startsWith('/')) {
      absoluteUrl = window.location.origin + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      absoluteUrl = 'https://' + url;
    }

    if (absoluteUrl.includes('localhost') || absoluteUrl.includes('127.0.0.1')) {
      return absoluteUrl; // Do not proxy local URLs
    }

    try {
      const proxyUrl = new URL('https://wsrv.nl/');
      proxyUrl.searchParams.set('url', absoluteUrl);
      proxyUrl.searchParams.set('output', 'webp');
      proxyUrl.searchParams.set('q', '75');
      
      // If width is provided and is a number, we can add it to proxy
      // We will skip specific width generation for now unless explicit, to prevent cropping issues,
      // but wsrv.nl handles resizing well if needed.
      return proxyUrl.toString();
    } catch (e) {
      return url; // Fallback
    }
  };

  const optimizedSrc = getOptimizedSrc(src);

  useEffect(() => {
    if (hero) return; // No lazy loading for hero images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            if (internalRef.current) {
              observer.unobserve(internalRef.current);
            }
          }
        });
      },
      {
        rootMargin: '300px',
      }
    );

    if (internalRef.current) {
      observer.observe(internalRef.current);
    }

    return () => {
      if (internalRef.current) {
        observer.unobserve(internalRef.current);
      }
    };
  }, [hero]);

  return (
    <img
      ref={setRefs}
      className={`lazy-img ${className}`}
      src={isLoaded ? optimizedSrc : undefined}
      data-src={!isLoaded ? optimizedSrc : undefined}
      alt={alt || "Image"}
      width={width}
      height={height}
      loading={hero ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={hero ? "high" : "auto"}
      {...props}
    />
  );
});
