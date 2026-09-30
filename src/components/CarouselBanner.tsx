import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HLSVideo from './HLSVideo';
import { LazyImage } from './LazyImage';
import { getOptimizedImageUrl } from '../utils/imageFormatter';

interface Banner {
    id: string;
    title: string;
    image_path: string;
    link?: string;
    mediaType?: 'image' | 'video';
    objectFit?: 'cover' | 'contain' | 'fill';
    mobileObjectFit?: 'cover' | 'contain' | 'fill';
    borderRadius?: string;
    aspectRatio?: string;
    mobileAspectRatio?: string;
}

interface CarouselBannerProps {
    banners: Banner[];
    showTitles?: boolean;
    forceSharp?: boolean;
}

export default function CarouselBanner({ banners, showTitles = true, forceSharp = false }: CarouselBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});

    const next = useCallback(() => setCurrentIndex((p) => (p + 1) % banners.length), [banners.length]);
    const prev = useCallback(() => setCurrentIndex((p) => (p - 1 + banners.length) % banners.length), [banners.length]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [banners.length, next]);

    if (!banners || banners.length === 0) return null;

    const firstBanner = banners[currentIndex] || banners[0];

    return (
        <div
            className="relative w-full bg-white overflow-hidden group transition-all duration-500 shadow-sm"
            style={{
                aspectRatio: (window.innerWidth < 768 ? (firstBanner?.mobileAspectRatio || firstBanner?.aspectRatio || '16/9') : (firstBanner?.aspectRatio || '21/9')).replace('/', ' / '),
                borderRadius: forceSharp ? '0' : `${firstBanner?.borderRadius || 12}px`
            } as any}
        >
            {/* Preload all banner images at once - native CSS transition, no framer */}
            {banners.map((banner, idx) => (
                <div
                    key={banner.id || idx}
                    className="absolute inset-0 w-full h-full"
                    style={{
                        opacity: idx === currentIndex ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                        pointerEvents: idx === currentIndex ? 'auto' : 'none',
                    }}
                >
                    {banner.mediaType === 'video' ? (
                        <HLSVideo
                            src={banner.image_path}
                            objectFit={(window.innerWidth < 768 ? (banner.mobileObjectFit || banner.objectFit) : banner.objectFit) || 'cover'}
                            className="w-full h-full"
                            onLoaded={() => setLoaded(p => ({ ...p, [idx]: true }))}
                            style={{ 
                                objectFit: (window.innerWidth < 768 ? (banner.mobileObjectFit || banner.objectFit) : banner.objectFit) || 'cover'
                            }}
                        />
                    ) : (
                        <LazyImage
                            src={getOptimizedImageUrl(banner.image_path) || 'https://placehold.co/1200x400?text=Aadityas+Aura'}
                            alt={banner.title}
                            hero={idx === 0}
                            className="w-full h-full"
                            style={{ 
                                objectFit: (window.innerWidth < 768 ? (banner.mobileObjectFit || banner.objectFit) : banner.objectFit) || 'cover'
                            } as any}
                            onLoad={() => setLoaded(p => ({ ...p, [idx]: true }))}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/1200x400?text=Aadityas+Aura';
                            }}
                        />
                    )}
                    {/* Shimmer while loading */}
                    {!loaded[idx] && idx === currentIndex && (
                        <span className="absolute inset-0 animate-shimmer" aria-hidden="true" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                    {showTitles && banner.title && !banner.title.startsWith('http') && (
                        <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 max-w-lg">
                            <h2 className="text-white text-2xl md:text-5xl font-serif mb-2 drop-shadow-lg">
                                {banner.title}
                            </h2>
                            <div className="w-24 h-1 bg-gold rounded-full shadow-lg" />
                        </div>
                    )}
                </div>
            ))}

            {banners.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 z-10"
                        aria-label="Next banner"
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div className="absolute bottom-4 right-6 flex gap-2 z-10">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to banner ${idx + 1}`}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-gold' : 'w-2 bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
