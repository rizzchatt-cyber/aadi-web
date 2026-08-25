import { motion } from 'motion/react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

import CarouselBanner from './CarouselBanner';
import { LazyImage } from './LazyImage';
import AutoScrollingGallery from './AutoScrollingGallery';

// Static particle positions — no random() on each render, precomputed
const PARTICLES = [
  { left: '10%', top: '20%', size: 2 },
  { left: '30%', top: '60%', size: 1.5 },
  { left: '55%', top: '15%', size: 2.5 },
  { left: '75%', top: '45%', size: 1 },
  { left: '88%', top: '70%', size: 2 },
  { left: '20%', top: '80%', size: 1.5 },
];

export default function Hero({ tagline, bgBanners }: { tagline?: string; image?: string; bgBanners?: any[] }) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-white py-16 md:py-24">
      {bgBanners && bgBanners.length > 0 && (
        <div className="absolute inset-0 z-0">
          <CarouselBanner banners={bgBanners} showTitles={false} forceSharp={true} />
          <div className="absolute inset-0 bg-black/[0.05] z-[1]" />
        </div>
      )}
      {/* Subtle gold glow — desktop only, no JS */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Reduced particle count — only 6, no Math.random() */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold"
            style={{ width: p.size, height: p.size, left: p.left, top: p.top, opacity: 0 }}
            animate={{ y: -120, opacity: [0, 0.35, 0] }}
            transition={{ duration: 18 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 3 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 relative"
        >
          <LazyImage
            src={logo}
            alt="Aaditya's Aura Logo"
            width="224"
            height="224"
            hero={true}
            className="w-52 md:w-64 mx-auto drop-shadow-[0_10px_30px_rgba(191,149,63,0.2)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/200?text=Aura+Logo';
            }}
          />
        </motion.div>

        {bgBanners?.[0]?.heroTextColor !== 'hidden' && (
          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`text-5xl md:text-8xl font-serif font-black tracking-tighter leading-none mb-6 ${bgBanners?.[0]?.heroTextColor === 'white'
              ? 'text-white'
              : bgBanners?.[0]?.heroTextColor === 'gold'
                ? 'text-transparent bg-clip-text gold-gradient'
                : 'text-charcoal'
              }`}
          >
            Aaditya's Aura
          </motion.h1>
        )}

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mb-8 origin-center"
        />

        {bgBanners?.[0]?.heroTextColor !== 'hidden' && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className={`text-base md:text-2xl font-serif italic max-w-xl mb-12 ${bgBanners?.[0]?.heroTextColor === 'white'
              ? 'text-white/70'
              : bgBanners?.[0]?.heroTextColor === 'gold'
                ? 'text-transparent bg-clip-text gold-gradient'
                : 'text-charcoal/50'
              }`}
          >
            "{tagline || 'Aesthetic appealing Jewellery, Attar & Perfume for aesthetic moment!'}"
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col items-center w-full"
        >
          <motion.button
            onClick={() => navigate('/collections')}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="px-12 py-5 gold-gradient text-white font-bold rounded-full shadow-luxury text-xs uppercase tracking-[0.3em] shimmer relative overflow-hidden mb-12"
          >
            Explore Aura
          </motion.button>

          {/* Experience Section Details */}
          <div className="text-center mb-8 max-w-sm px-4">
            <h2 className={`text-xl md:text-2xl font-serif tracking-tight mb-2 ${
              bgBanners?.[0]?.heroTextColor === 'white'
                ? 'text-white'
                : bgBanners?.[0]?.heroTextColor === 'gold'
                  ? 'text-transparent bg-clip-text gold-gradient font-bold'
                  : 'text-charcoal font-semibold'
            }`}>
              Inside Aaditya's Aura
            </h2>
            <p className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold ${
              bgBanners?.[0]?.heroTextColor === 'white'
                ? 'text-white/60'
                : bgBanners?.[0]?.heroTextColor === 'gold'
                  ? 'text-transparent bg-clip-text gold-gradient'
                  : 'text-gold'
            }`}>
              Pure Trust • Real Experience
            </p>
          </div>

          {/* Grid with Video and Auto Gallery */}
          <div className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 justify-items-center overflow-visible">
            {/* Video Column */}
            <div className="w-full flex flex-col items-center">
              <h3 className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-3 ${
                bgBanners?.[0]?.heroTextColor === 'white' ? 'text-white/80' : 'text-charcoal/60'
              }`}>
                Customer Review
              </h3>
              <div 
                className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-luxury border-4 border-gold bg-black transform-gpu hover:scale-[1.01] transition-transform duration-500"
                style={{ aspectRatio: '9/16' }}
              >
                <CustomVideoPlayer src="/customer_review.mp4" />
              </div>
            </div>

            {/* Auto Gallery Column */}
            <div className="w-full flex flex-col items-center overflow-visible">
              <h3 className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-3 ${
                bgBanners?.[0]?.heroTextColor === 'white' ? 'text-white/80' : 'text-charcoal/60'
              }`}>
                Our Store
              </h3>
              <div className="relative w-full max-w-[320px] overflow-visible">
                <AutoScrollingGallery heroTextColor={bgBanners?.[0]?.heroTextColor} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CustomVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const wasPlayingRef = useRef(true);
  const wasMutedRef = useRef(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Initial sync
    setIsPlaying(!video.paused);
    setIsMuted(video.muted);
    wasPlayingRef.current = !video.paused;
    wasMutedRef.current = video.muted;

    // IntersectionObserver to pause/mute when scrolled off-screen and resume when back
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // Record video states before scrolling off
            wasPlayingRef.current = !video.paused;
            wasMutedRef.current = video.muted;

            video.pause();
            video.muted = true;
            setIsMuted(true);
          } else {
            // Restore play & sound states if the video was active before scrolling off
            if (wasPlayingRef.current) {
              video.play().catch((err) => console.log('Auto-play failed:', err));
            }
            video.muted = wasMutedRef.current;
            setIsMuted(wasMutedRef.current);
          }
        });
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      observer.unobserve(video);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.log('Video play failed:', err));
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div 
      onClick={togglePlay}
      className="relative w-full h-full cursor-pointer group"
    >
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        muted={isMuted}
        autoPlay
        className="w-full h-full object-cover"
      />
      
      {/* Central Play/Pause button (fades in on hover/pause) */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 bg-black/20'}`}>
        <div className="w-14 h-14 rounded-full bg-white/90 text-charcoal flex items-center justify-center shadow-luxury hover:scale-105 active:scale-95 transition-all">
          {isPlaying ? (
            <Pause size={24} fill="currentColor" className="text-charcoal" />
          ) : (
            <Play size={24} fill="currentColor" className="text-charcoal translate-x-0.5" />
          )}
        </div>
      </div>

      {/* Floating Mute/Unmute Button (Bottom Right) */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
