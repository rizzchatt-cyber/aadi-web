import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DriveImage from './DriveImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const GALLERY_IMAGES = [
  {
    id: "16BTry7qLN1_zlUxs2KJYQXLrfPwSTSxb",
    title: "A Personalized Journey",
    desc: "Guiding guests through our selection of hand-blended attars."
  },

  {
    id: "1F0IzKGyio2g5-M0Tjd4XR66wWf4r87cr",
    title: "Consultation of Craftsmanship",
    desc: "Assisting a customer with our fine hand-crafted gold jewelry selection."
  },
  {
    id: "1GHPlHvNzXCzxgLuuHPW0QMOltt3uD4Kz",
    title: "A Gift of Pure Fragrance",
    desc: "Welcoming our guests with traditional and modern scent collections."
  },
  {
    id: "1HrlXcpuGVwk0F9edwCjhAUV57TiI5gWF",
    title: "Transparent Billing",
    desc: "Ensuring trust with verified weights and computerized invoices."
  },
  {
    id: "1JD9ZpHX5MN_6qjl8bBmYT_d6uNMitiRi",
    title: "Aaditya's Aura Scent Collection",
    desc: "A display of premium perfumes, attars, and luxury gift sets."
  },
  {
    id: "1K8D9IOa6FF-mrfoNpC-ZMzapUEyK39x3",
    title: "Exclusive Gift Selections",
    desc: "Combining our finest hand-blended attars for special occasions."
  },
  {
    id: "1Ko_9_Iv3F1MAca_qNXMrcNLc94qc-9Q4",
    title: "Family Shopping Experience",
    desc: "Welcoming families to browse our extensive collections together."
  },
  {
    id: "1N0YiefhvpWSCoJAk3YGWirgSOF_uurcq",
    title: "Detailed Consultation",
    desc: "Explaining design options to find the perfect ornament."
  },
  {
    id: "1UAIUqqkadKqZBtm5asEFJEdPnYRzk0Ed",
    title: "Shared Scent Consultation",
    desc: "Exploring our premium attars to find a fragrance you both love."
  },
  {
    id: "1jTQMK-U-uSSNPzgIZ2RDJRUGn3Qv4aKY",
    title: "Silver Bichiya Selection",
    desc: "An extensive range of traditional silver toe rings."
  },
  {
    id: "1khGJZjq_9dW-P77Isa7sSzI2-_CaZGNh",
    title: "Artisanal Decanting",
    desc: "Custom filling perfume vials with our signature blends."
  },
  {
    id: "1mv8WizXTEJF255uuhN36Qh1qlpbtnChh",
    title: "Securing the Purchase",
    desc: "Finalizing and wrapping your purchase with care."
  },
  {
    id: "1q2iYe8B6SsqZFYMk_QFhlAWhYqvvrBqY",
    title: "Secure Shipping",
    desc: "Every order is triple-sealed and insured for nationwide transit."
  },
  {
    id: "1xNx3DunTaFYJ-AEMBbCIEgHL4AmLhPG2",
    title: "Silver Payal Collection",
    desc: "Curated silver anklets showing pure silver craftsmanship."
  },
  {
    id: "1xjK6hUspXTKdobh77agYudFUGV2x7qJm",
    title: "Traditional Ornaments",
    desc: "Hand-crafted silver ankle chains highlighting intricate links."
  },
  {
    id: "1LepwRcauup4XWy9R3F-KN6ZTRSF0l_-u",
    title: "A Warm Welcome",
    desc: "Greeting guests with trusted hospitality."
  },
  {
    id: "10EsootsNPdejorkcP-jxx8qBvH0EPUty",
    title: "Exquisite Consultations",
    desc: "Helping patrons select their perfect gold and silver pieces."
  },
  {
    id: "1AuT-5yigcVfHS1yracs7oBuoqY_CDzzx",
    title: "The Art of Attar Blending",
    desc: "Decanting our signature pure perfume oils from custom vials."
  },
  {
    id: "1VDFtJgI0MtIisWrgvNGtMuFxkkCSgCJ-",
    title: "First Aromas",
    desc: "Experiencing the rich, authentic top notes of distilled fragrance."
  },
  {
    id: "1NzIo2xSTJO_yKVTqcz6yZaXIUEH79x_c",
    title: "The Gold Bag Handover",
    desc: "Ensuring pure joy and satisfaction with every package."
  },
  {
    id: "1ELC27p3idAHj4pDMhE9T10RCUn3dBIis",
    title: "Family Shopping Moments",
    desc: "Creating timeless memories under our showroom chandeliers."
  },
  {
    id: "1vRxjQZ4xzCdFaOl8mQko84_NSlu_hdO4",
    title: "Our Premium Scent Bar",
    desc: "Presenting natural oils and sandalwood to find the ideal signature scent."
  }
];

const AUTOPLAY_INTERVAL = 4000; // 4 seconds

interface AutoScrollingGalleryProps {
  heroTextColor?: string;
}

export default function AutoScrollingGallery({ heroTextColor }: AutoScrollingGalleryProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const nextImage = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  };

  // Autoplay (resets when index changes due to manual navigation)
  useEffect(() => {
    const timer = setInterval(() => {
      nextImage();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [index]);

  // Helper to determine stack layout transformations for a deck-of-cards structure (no GPU blurs to prevent lag)
  const getCardStyle = (cardIdx: number) => {
    let diff = cardIdx - index;
    const len = GALLERY_IMAGES.length;
    
    // Circular wrap-around math
    if (diff < -len / 2) diff += len;
    if (diff > len / 2) diff -= len;

    if (diff === 0) {
      // Center card
      return {
        x: '0%',
        scale: 1,
        opacity: 1,
        zIndex: 10,
        pointerEvents: 'auto' as const
      };
    } else if (diff === -1) {
      // Left stacked card (previous) - shifted left and scaled to 90%
      return {
        x: '-16%',
        scale: 0.90,
        opacity: 0.55,
        zIndex: 5,
        pointerEvents: 'none' as const
      };
    } else if (diff === 1) {
      // Right stacked card (next) - shifted right and scaled to 90%
      return {
        x: '16%',
        scale: 0.90,
        opacity: 0.55,
        zIndex: 5,
        pointerEvents: 'none' as const
      };
    } else {
      // Offscreen cards
      return {
        x: diff < 0 ? '-40%' : '40%',
        scale: 0.8,
        opacity: 0,
        zIndex: 1,
        pointerEvents: 'none' as const
      };
    }
  };

  const currentImage = GALLERY_IMAGES[index];

  return (
    <div className="relative w-[86%] sm:w-[90%] md:w-full aspect-[9/16] overflow-visible select-none mx-auto">
      
      {/* Ambient Reflection Backdrop - Smoothly cross-fading blurred backdrops */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none rounded-2xl">
        {GALLERY_IMAGES.map((img, idx) => {
          const isActive = idx === index;
          return (
            <div
              key={`bg-${img.id}`}
              className="absolute inset-0"
              style={{
                opacity: isActive ? 0.5 : 0,
                transition: 'opacity 1000ms ease-in-out',
                zIndex: isActive ? 2 : 1
              }}
            >
              <DriveImage
                src={`https://drive.google.com/file/d/${img.id}/view`}
                alt=""
                className="w-full h-full object-cover blur-[8px] scale-105"
              />
            </div>
          );
        })}
        <div className="absolute inset-0 bg-black/15 z-[3]" />
      </div>

      {/* 3-Card Carousel Area (Cards are always w-full h-full to prevent stretching) */}
      <div className="relative w-full h-full flex items-center justify-center overflow-visible z-10">
        {GALLERY_IMAGES.map((img, idx) => {
          const isCenter = idx === index;
          
          // Lazy load check
          let diff = idx - index;
          const len = GALLERY_IMAGES.length;
          if (diff < -len / 2) diff += len;
          if (diff > len / 2) diff -= len;
          return (
            <motion.div
              key={img.id}
              animate={getCardStyle(idx)}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1] // iOS-like unified ease-out curve for perfect synchronization
              }}
              onClick={() => {
                if (!isCenter) {
                  // Direct circular offset click direction
                  if (diff === -1) {
                    prevImage();
                  } else if (diff === 1) {
                    nextImage();
                  }
                }
              }}
              className="absolute left-0 top-0 w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border-4 border-gold shadow-luxury cursor-pointer transform-gpu"
            >
              <DriveImage
                src={`https://drive.google.com/file/d/${img.id}/view`}
                alt={img.title}
                className="w-full h-full object-cover"
                priority={isCenter}
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {/* Tag Capsule inside the image */}
              <div className="absolute top-4 left-4 z-20 bg-black/45 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white">
                  Our Store
                </span>
              </div>

              {/* Title, description, and dots overlay inside the center card */}
              {isCenter && (
                <div className="absolute bottom-0 inset-x-0 p-6 text-left flex flex-col z-20">
                  <h3 className="text-white text-lg font-serif font-bold tracking-wide mb-1.5 leading-tight">
                    {img.title}
                  </h3>
                  <p className="text-white/80 text-xs font-sans font-light leading-relaxed mb-4">
                    {img.desc}
                  </p>

                  {/* Pagination Dots */}
                  <div className="flex gap-1.5 justify-start">
                    {GALLERY_IMAGES.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDirection(dotIdx > index ? 1 : -1);
                          setIndex(dotIdx);
                        }}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          dotIdx === index ? 'w-5 bg-gold' : 'w-1.5 bg-white/40'
                        }`}
                        aria-label={`Go to slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Manual Slideshow Controls */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between items-center z-30 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-gold/90 text-white flex items-center justify-center backdrop-blur-xs pointer-events-auto opacity-100 hover:scale-105 active:scale-95 transition-all shadow-md border border-white/15 cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-gold/90 text-white flex items-center justify-center backdrop-blur-xs pointer-events-auto opacity-100 hover:scale-105 active:scale-95 transition-all shadow-md border border-white/15 cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
    </div>
  );
}
