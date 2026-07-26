import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HLSVideoProps {
    src: string;
    objectFit: string;
    onLoaded?: () => void;
    className?: string;
    style?: any;
}

export default function HLSVideo({ src, objectFit, onLoaded, className, style }: HLSVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const video = videoRef.current;
        if (!video) return;

        const isHLS = src.toLowerCase().includes('.m3u8');

        if (isHLS) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    video.play().catch(() => { });
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error('HLS Network Error:', data);
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error('HLS Media Error:', data);
                                hls.recoverMediaError();
                                break;
                            default:
                                console.error('HLS Fatal Error:', data);
                                hls.destroy();
                                break;
                        }
                    }
                });
                return () => hls.destroy();
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
                video.oncanplay = () => setIsLoading(false);
                video.play().catch(() => { });
            }
        } else {
            video.src = src;
            video.oncanplay = () => setIsLoading(false);
            video.load();
        }
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => { });
                    } else {
                        video.pause();
                    }
                });
            },
            {
                threshold: 0.01
            }
        );

        observer.observe(video);

        return () => {
            observer.unobserve(video);
        };
    }, []);

    return (
        <div className={`relative ${className || "w-full h-full"} overflow-hidden`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-[2px] z-10">
                    <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full transition-opacity duration-500"
                style={{ ...style, objectFit: objectFit as any, opacity: isLoading ? 0 : 1 }}
                onCanPlay={() => {
                    setIsLoading(false);
                    onLoaded?.();
                }}
            />
        </div>
    );
}
