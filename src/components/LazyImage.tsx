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
  const internalRef = useRef<HTMLImageElement>(null);

  // Merge refs so both parent and element can access the DOM node
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

    // Direct Google CDN links should be loaded directly, without wsrv.nl proxy
    if (absoluteUrl.includes('googleusercontent.com') || absoluteUrl.includes('drive.google.com')) {
      return absoluteUrl;
    }

    try {
      const proxyUrl = new URL('https://wsrv.nl/');
      proxyUrl.searchParams.set('url', absoluteUrl);
      proxyUrl.searchParams.set('output', 'webp');
      proxyUrl.searchParams.set('q', '75');
      return proxyUrl.toString();
    } catch (e) {
      return url; // Fallback
    }
  };

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <img
      ref={setRefs}
      className={`lazy-img ${className}`}
      src={optimizedSrc}
      alt={alt || "Image"}
      width={width}
      height={height}
      loading={hero ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={hero ? "high" : "auto"}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
});
