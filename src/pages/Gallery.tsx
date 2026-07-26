import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import DriveImage from '../components/DriveImage';

// Fully updated gallery images matching the actual showroom & customer photos in the Google Drive folder
const galleryImages = [
  { id: "16BTry7qLN1_zlUxs2KJYQXLrfPwSTSxb", title: "A Personalized Olfactory Journey", desc: "Our team guiding guests through our selection of hand-blended attars and custom fragrances at the premium scent bar." },

  { id: "1F0IzKGyio2g5-M0Tjd4XR66wWf4r87cr", title: "Consultation of Craftsmanship", desc: "Assisting a customer with our fine gold jewelry selection, showing the intricate hand-crafted patterns on each piece." },
  { id: "1GHPlHvNzXCzxgLuuHPW0QMOltt3uD4Kz", title: "A Gift of Pure Fragrance", desc: "Welcoming our guests with signature attars, sharing the rich scents of our traditional and modern collections." },
  { id: "1HrlXcpuGVwk0F9edwCjhAUV57TiI5gWF", title: "Transparent Billing & Invoicing", desc: "Ensuring clarity and trust with computerised invoices, verified weights, and official documentation for every purchase." },
  { id: "1JD9ZpHX5MN_6qjl8bBmYT_d6uNMitiRi", title: "Aaditya's Aura Scent Collection", desc: "A display of our signature perfumes, attars, and premium gift sets, embodying luxury in every bottle." },
  { id: "1K8D9IOa6FF-mrfoNpC-ZMzapUEyK39x3", title: "Exclusive Gift Selections", desc: "Guiding guests through our range of luxury gift sets, combining our finest hand-blended attars for special occasions." },
  { id: "1Ko_9_Iv3F1MAca_qNXMrcNLc94qc-9Q4", title: "A Welcoming Family Experience", desc: "Welcoming families to browse our extensive collections of heritage gold and silver jewelry, in a friendly and comfortable setting." },
  { id: "1N0YiefhvpWSCoJAk3YGWirgSOF_uurcq", title: "Detailed Jewelry Consultation", desc: "Explaining the design options and silver specifications to a customer to find the perfect ornament." },
  { id: "1UAIUqqkadKqZBtm5asEFJEdPnYRzk0Ed", title: "A Shared Scent Consultation", desc: "Assisting a couple in exploring our premium attars to find a fragrance that they both love." },
  { id: "1jTQMK-U-uSSNPzgIZ2RDJRUGn3Qv4aKY", title: "Silver Bichiya Selection", desc: "Offering an extensive range of traditional silver bichiya (toe rings) and matching ornaments for our patrons." },
  { id: "1khGJZjq_9dW-P77Isa7sSzI2-_CaZGNh", title: "Artisanal Decanting Process", desc: "Custom filling perfume vials with our signature blends under the curious eyes of our visitors." },
  { id: "1mv8WizXTEJF255uuhN36Qh1qlpbtnChh", title: "Securing the Purchase", desc: "Finalizing the details of a customer's purchase, wrapped with care in our signature jewelry packaging." },
  { id: "1q2iYe8B6SsqZFYMk_QFhlAWhYqvvrBqY", title: "Nationwide Secure Shipping", desc: "Every online order is securely packaged and triple-sealed with our seal of trust, ready for fully insured delivery across India." },
  { id: "1xNx3DunTaFYJ-AEMBbCIEgHL4AmLhPG2", title: "Silver Payal Collection", desc: "Presenting our curated silver payals and anklets, showing various weights and styles to suit our clients' preferences." },
  { id: "1xjK6hUspXTKdobh77agYudFUGV2x7qJm", title: "Traditional Silver Ornaments", desc: "Showcasing our range of hand-crafted silver payals and ankle chains, highlighting the intricate links and pure silver craftsmanship." },
  { id: "1LepwRcauup4XWy9R3F-KN6ZTRSF0l_-u", title: "A Warm Welcome", desc: "Our showroom team greeting guests as we celebrate a year of trusted relationships and fine craftsmanship." },
  { id: "10EsootsNPdejorkcP-jxx8qBvH0EPUty", title: "Shared Jewelry Consultations", desc: "Guiding our customers through our silver and gold collections in a warm, comfortable lounge setting." },
  { id: "1AuT-5yigcVfHS1yracs7oBuoqY_CDzzx", title: "The Art of Attar Blending", desc: "Meticulously decanting our signature pure perfume oils from beakers to customized vials." },
  { id: "1VDFtJgI0MtIisWrgvNGtMuFxkkCSgCJ-", title: "First Aromas", desc: "A customer experiencing the rich, authentic top notes of our custom perfume blends at the counter." },
  { id: "12CPZcfs3v6PknMIzLb8rjU-0RQXxMJ96", title: "Signature Fragrance Guidance", desc: "Helping guests discover and sample the exact scent profile that matches their persona." },
  { id: "1NzIo2xSTJO_yKVTqcz6yZaXIUEH79x_c", title: "The Gold Bag Handover", desc: "Handing over our signature golden bag filled with authentic purchases and smiles." },
  { id: "1VMqJZ7GmjjeBNPsHzAV2tCtBsJgG_pRP", title: "Seamless Checkout Experience", desc: "Ensuring a fully transparent and secure billing process for our valued patrons." },
  { id: "1ELC27p3idAHj4pDMhE9T10RCUn3dBIis", title: "Family Shopping Moments", desc: "A family enjoying their time selecting heritage ornaments together under our showroom chandeliers." },
  { id: "1N6ZpLqQMfJa0h9Dckh-InEnuYpZPtHu2", title: "Nationwide Insured Delivery", desc: "Securely wrapped, triple-sealed parcels ready to carry our authentic jewelry and perfumes across India." },
  { id: "1rhdahab-8tHptq9lAQ4mFyQH6cVyDvlX", title: "Guided Gold Selection", desc: "Explaining the hallmark details and intricate patterns of our gold ornaments to guests." },
  { id: "1Jzk9PNOWsfpLYJgAhF3DXHngDBj7LZqZ", title: "Handshakes of Trust", desc: "Sealing a transaction with a warm handshake, celebrating a lifetime relationship of trust." },
  { id: "1jIiVS1v6IRZRUg5Nf9fDeIgd_4pn8Wqa", title: "Fragrance Discovery with Friends", desc: "Friends sharing the sensory pleasure of sampling and picking a natural perfume together." },
  { id: "1vRxjQZ4xzCdFaOl8mQko84_NSlu_hdO4", title: "Our Premium Scent Bar", desc: "Presenting premium oils in hand-decorated decanters to assist customers in finding their ideal scent." },
  { id: "10Ns-USEOzhRlSomKWBDPxZIzVg5G2pNv", title: "Transparent Billing & Records", desc: "Every purchase is backed by verified computerised billing, weights, and detailed invoices." },
  { id: "1Yki2uyW5Q_fVXxsV8xqklJIhtUQlWME8", title: "Browsing Curated Displays", desc: "Guests exploring our ornaments under the helpful guidance of our showroom team." },
  { id: "1xZOvqWNzcaneDULYClEYZNHcrtJiwEoq", title: "Exclusive Presentation", desc: "A private consultation featuring our finest handcrafted sets for a special celebration." },
  { id: "1fCYBDVhAZP1YD3OZc_fF1VGp2t_d5b3m", title: "Double-Insured Shipments", desc: "Carefully preparing online orders for insured courier transit to guarantee safety." },
  { id: "1yXXwg3RQ7wwSEAX0VrlC5YMjaJ5elnpf", title: "Authentic Selection", desc: "Assisting customers with trying on jewelry pieces to find their perfect match." },
  { id: "1xEQhOkVQ4XBhwGjT8JREa9uNQQPmTJLM", title: "Evaluating Aroma Notes", desc: "Evaluating fragrance profiles on tester strips to discover the base and heart notes." },
  { id: "1eg9FLBcXXXHug5t0i2Yy8Hn0sBIWplfw", title: "Concentrated Oil Scenting", desc: "A guest experiencing the pure aroma of our oil attars from a luxury roll-on vial." },
  { id: "1bysvYMyJU9IB-N_fYzetb1X-u4V8PGJs", title: "Gold Chain Fitting", desc: "Sizing and trying on a classic gold link chain with a direct viewing mirror." },
  { id: "1cIAmPi_9UPi6aWtstti9q15vu806bvsa", title: "Precise Formulations", desc: "Blending and measuring individual notes to craft a customized signature perfume." },
  { id: "1t2k2hYCzz7NV3T-WNRR8lW6oMzk-hJAM", title: "A World of Attars", desc: "Guiding a young client through our wide collection of premium gold-detailed fragrance bottles." },
  { id: "1F94PlWz_0gytn7rhIQ-ju36H41Fky0zX", title: "Satisfied Customers", desc: "A happy customer sharing his satisfaction after finding his signature scent." },
  { id: "1587f2YC1tgQXpr0QWnZaCIN6RwCHxAhp", title: "Trying Gold Masterpieces", desc: "A customer trying on a heavy, hand-woven luxury gold chain in our showroom." },
  { id: "1dwMiP1jNsdvfjdN4B5yF28H8g32_hmwu", title: "Showroom Celebrations", desc: "Serving and celebrating with multiple families during the festive wedding shopping season." },
  { id: "1wyDflczFoLfzDrR_2i_bO17ohYKozHf8", title: "Fragrant Discoveries", desc: "A customer leaning in to sample the natural, soothing notes of distilled sandalwood." },
  { id: "14Sq1PplTiHFRNP9Jdmq5-B06TYYaUyw4", title: "Shared Aromas", desc: "Ladies enjoying their afternoon picking out natural attars and sharing fragrance reviews." }
];

// Elegant Illustrate Boxes (Quotes/Reviews & Trust Badges) to mix into the collage
const illustrateBoxes = [
  {
    type: "quote",
    text: "The service is outstanding. Seeing the attar being decanted in front of me felt extremely authentic!",
    author: "Rohan S.",
    stars: 5
  },
  {
    type: "badge",
    title: "100% Certified Gold & Silver",
    desc: "Every single ornament is hallmarked, verified, and comes with an official certificate of purity.",
    bg: "bg-linear-to-br from-gold/10 via-luxury-cream to-gold/5"
  },
  {
    type: "quote",
    text: "Aaditya's Aura has become our family's trusted showroom. The staff is welcoming and very transparent.",
    author: "Priya K.",
    stars: 5
  },
  {
    type: "badge",
    title: "Insured Delivery Promise",
    desc: "Every online order is packed under CCTV, triple-sealed, and fully insured for nationwide transit.",
    bg: "bg-linear-to-br from-gold/5 via-luxury-cream to-luxury-white" // Modified from black to light gold theme for readability
  },
  {
    type: "quote",
    text: "Their signature Oudh smells divine and lasts all day. Highly recommend visiting their showroom!",
    author: "Amit V.",
    stars: 5
  },
  {
    type: "badge",
    title: "Artisanal Heritage",
    desc: "Our designs are inspired by ancient Indian art, preserving heritage craftsmanship in every detail.",
    bg: "bg-luxury-cream border-2 border-dashed border-gold/30"
  }
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const nextImage = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage + 1) % galleryImages.length);
  };

  const prevImage = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage - 1 + galleryImages.length) % galleryImages.length);
  };

  // Build the collage: Interleave the 28 pictures with the Illustrate boxes
  const collageItems = [];
  let illustrateIdx = 0;
  
  // Collage Styling Config
  const cardRotations = ["rotate-[1.5deg]", "rotate-[-2deg]", "rotate-[2.5deg]", "rotate-[-1deg]", "rotate-[1.8deg]", "rotate-[-2.2deg]"];
  const cardTranslates = ["translate-y-2", "-translate-y-1", "translate-x-1.5", "-translate-x-1.5", "translate-y-1", "translate-y-0"];
  
  // Adhesive tape rotations for an organic pinned-up look
  const tapeRotations = ["rotate-[-3deg]", "rotate-[2deg]", "rotate-[-1deg]", "rotate-[4deg]", "rotate-[-2.5deg]", "rotate-[1.5deg]"];
  
  // Diverse Random Frame Styles
  const frameStyles = [
    "bg-white p-3 pb-8 border border-gold/10 shadow-md", // Classic Polaroid Frame
    "bg-luxury-cream p-3 border-2 border-gold/25 shadow-lg", // Elegant Gold Frame
    "bg-white p-2.5 border border-charcoal/5 shadow-sm", // Clean Minimalist Frame
    "bg-luxury-cream p-3.5 border border-gold/15 outline outline-1 outline-gold/10 outline-offset-2 shadow-md" // Double Gold Outline Frame
  ];

  for (let i = 0; i < galleryImages.length; i++) {
    const rot = cardRotations[i % cardRotations.length];
    const trans = cardTranslates[i % cardTranslates.length];
    const tapeRot = tapeRotations[i % tapeRotations.length];
    const frame = frameStyles[i % frameStyles.length];
    
    collageItems.push({ 
      type: 'image', 
      data: galleryImages[i], 
      globalIndex: i,
      transformClass: `${rot} ${trans}`,
      tapeClass: tapeRot,
      frameClass: frame
    });
    
    // Insert an illustrate box every 4-5 items
    if ((i + 1) % 4 === 0 && illustrateIdx < illustrateBoxes.length) {
      const boxRot = cardRotations[(i + 3) % cardRotations.length];
      const boxTapeRot = tapeRotations[(i + 2) % tapeRotations.length];
      collageItems.push({ 
        type: 'illustrate', 
        data: illustrateBoxes[illustrateIdx],
        transformClass: `${boxRot}`,
        tapeClass: boxTapeRot
      });
      illustrateIdx++;
    }
  }

  // Custom SVG Illustrations to replace emojis
  const renderIllustration = (title: string) => {
    if (title.includes("Certified")) {
      return (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      );
    }
    if (title.includes("Insured")) {
      return (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    }
    // Artisanal Heritage
    return (
      <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.343 7.258a2.437 2.437 0 00-3.283 0m3.283 0a2.437 2.437 0 010 3.283m-3.283-3.283a2.437 2.437 0 000 3.283m0 0a2.437 2.437 0 01-3.283 0m3.283 0v3.586m-6.72-3.999a2.436 2.436 0 000 3.283m0 0a2.436 2.436 0 013.283 0m-3.283-3.283a2.436 2.436 0 003.283 0m0 0V9.75m0 0l4-1.242m-4 1.242L18 8.508m-6.72 1.242l-4-1.242m4 1.242v7.125m0 0l-3-1.036m3 1.036l3-1.036m-3-6.089v6.089m0 0H9m3 0h3" />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-luxury-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif mb-6 text-charcoal tracking-luxury uppercase px-2"
          >
            Showroom Stories & Trust
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gold font-serif italic text-lg md:text-xl max-w-2xl mx-auto px-4"
          >
            Take a glimpse inside Aaditya's Aura—where hand-blended fragrances and authentic jewelry create moments of pure joy and lifetime trust.
          </motion.p>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-32 h-[2px] bg-gold mx-auto mt-8 shimmer origin-center" 
          />
        </div>

        {/* Dynamic Collage Grid (optimized for phone & desktop random collage look) */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-10 px-2 sm:px-0 pt-6">
          {collageItems.map((item, index) => {
            if (item.type === 'image') {
              const img = item.data as typeof galleryImages[0];
              const globalIdx = item.globalIndex!;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6 }}
                  key={`img-${img.id}`}
                  onClick={() => setSelectedImage(globalIdx)}
                  className={`break-inside-avoid relative rounded-lg overflow-visible group cursor-pointer transition-all duration-500 hover:scale-[1.02] transform-gpu ${item.transformClass} ${item.frameClass}`}
                >
                  {/* Translucent adhesive tape effect */}
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4.5 bg-amber-50/45 backdrop-blur-[1px] border-l border-r border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)] pointer-events-none z-10 ${item.tapeClass}`} />

                  {/* Polaroid Frame inner styling */}
                  <div className="w-full relative overflow-hidden rounded-md bg-luxury-cream aspect-[4/5]">
                    <DriveImage
                      src={`https://drive.google.com/file/d/${img.id}/view`}
                      alt={img.title}
                      className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105"
                      priority={index < 4} // prioritize loading first 4 images above the fold
                    />
                  </div>

                  {/* Descriptions perfectly suited to the pics */}
                  <div className="pt-4 pb-1 px-1 text-left">
                    <h3 className="text-charcoal font-serif text-base md:text-lg mb-1.5 group-hover:text-gold transition-colors duration-300 font-bold">{img.title}</h3>
                    <p className="text-charcoal/70 text-xs font-sans leading-relaxed line-clamp-3">{img.desc}</p>
                  </div>

                  {/* Golden Overlay details */}
                  <div className="absolute top-6 right-6 bg-charcoal/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-gold/25 text-[9px] text-gold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View Story
                  </div>
                </motion.div>
              );
            } else {
              // Illustrate Box Card
              const box = item.data as typeof illustrateBoxes[0];
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  key={`box-${index}`}
                  className={`break-inside-avoid p-8 rounded-lg flex flex-col justify-center shadow-luxury border border-gold/15 min-h-[240px] relative transition-all duration-500 transform-gpu hover:scale-[1.02] text-charcoal ${item.transformClass} ${
                    box.bg || 'bg-luxury-cream'
                  }`}
                >
                  {/* Translucent adhesive tape effect on illustrate boxes */}
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4.5 bg-amber-50/45 backdrop-blur-[1px] border-l border-r border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)] pointer-events-none z-10 ${item.tapeClass}`} />

                  {box.type === 'quote' ? (
                    <>
                      {/* Custom quotation SVG instead of emoji */}
                      <svg className="text-gold/40 w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="text-charcoal/85 font-sans italic text-xs md:text-sm leading-relaxed mb-4">{box.text}</p>
                      <div className="flex justify-between items-center border-t border-gold/15 pt-3">
                        <span className="text-charcoal font-serif font-bold text-[10px] md:text-xs">{box.author}</span>
                        <div className="text-gold text-[10px] md:text-xs">
                          {"★".repeat(box.stars)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Premium SVG Illustration instead of emoji */}
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-4 border border-gold/20 shadow-xs">
                        {renderIllustration(box.title)}
                      </div>
                      <h3 className={`font-serif text-base md:text-lg mb-3 font-bold ${box.title.includes('100%') ? 'gold-text-gradient' : 'text-charcoal'}`}>{box.title}</h3>
                      <p className="text-charcoal/70 text-xs leading-relaxed">{box.desc}</p>
                    </>
                  )}
                </motion.div>
              );
            }
          })}
        </div>

        {/* Fancy Lightbox Overlay */}
        <AnimatePresence>
          {selectedImage !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/95 backdrop-blur-md p-4"
              onClick={() => setSelectedImage(null)}
            >
              {/* Floating Close Button in our cream & gold theme (no longer black) */}
              <button 
                onClick={() => setSelectedImage(null)}
                className="fixed top-4 right-4 md:top-6 md:right-6 bg-luxury-cream text-charcoal hover:bg-gold hover:text-luxury-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-[120] shadow-lg border border-gold/45 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>

              {/* Navigation Buttons (Hidden on mobile for touch swipe usability) */}
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="hidden md:block absolute left-8 text-luxury-white/60 hover:text-luxury-white text-4xl p-2 transition-all cursor-pointer"
              >
                ‹
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="hidden md:block absolute right-8 text-luxury-white/60 hover:text-luxury-white text-4xl p-2 transition-all cursor-pointer"
              >
                ›
              </button>

              {/* Lightbox Container Wrapper (overflow-visible to allow tape to overflow) */}
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] flex flex-col pt-4 overflow-visible"
              >
                {/* Adhesive tape effect at the top of the popup (matches collage) */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-50/45 backdrop-blur-[1.5px] border-l border-r border-white/20 shadow-[0_1px_3px_rgba(0,0,0,0.06)] pointer-events-none z-[110] rotate-[-1deg]" />

                {/* Main Card Content (overflow-hidden to preserve rounded corners) */}
                <div className="bg-luxury-cream w-full rounded-2xl overflow-y-auto flex flex-col md:flex-row border border-gold/25 shadow-luxury">
                  {/* Image side (Uniform luxury cream background and gold separators) */}
                  <div className="md:w-3/5 bg-luxury-cream flex items-center justify-center p-4 sm:p-6 min-h-[300px] sm:min-h-[380px] md:min-h-[500px] border-b md:border-b-0 md:border-r border-gold/15">
                    <div className="w-full h-full flex items-center justify-center max-h-[40vh] md:max-h-[70vh]">
                      <DriveImage
                        src={`https://drive.google.com/file/d/${galleryImages[selectedImage].id}/view`}
                        alt={galleryImages[selectedImage].title}
                        className="max-h-[40vh] md:max-h-[70vh] w-auto object-contain rounded-md"
                        priority={true}
                      />
                    </div>
                  </div>

                  {/* Details side */}
                  <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-luxury-cream">
                    <div>
                      <span className="text-gold font-serif italic text-xs block mb-1">Showroom Story</span>
                      <h2 className="text-2xl md:text-3xl font-serif text-charcoal mb-4 border-b border-gold/10 pb-4 font-bold">{galleryImages[selectedImage].title}</h2>
                      <p className="text-charcoal/80 leading-relaxed text-sm mb-6">{galleryImages[selectedImage].desc}</p>
                    </div>
                    
                    {/* Luxury Trust Message */}
                    <div className="border-t border-gold/25 pt-6 mt-4 md:mt-0">
                      <h4 className="font-serif text-xs font-bold text-gold uppercase tracking-wider mb-2">Our Promise</h4>
                      <p className="text-charcoal/60 text-xs italic">
                        This moment reflects our commitment to absolute purity, transparent business, and our promise of lifetime trust.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 text-center border-t border-gold/15 pt-16"
        >
          <h2 className="text-2xl md:text-3xl font-serif text-charcoal mb-4 px-2">Discover the Aaditya's Aura Experience</h2>
          <p className="text-charcoal/60 mb-10 max-w-lg mx-auto text-sm px-4">
            Interested in visiting us? Follow us on Instagram or drop by our showroom for a personalized sensory journey.
          </p>
          <a 
            href="https://instagram.com/aadityas.aura" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 gold-gradient text-charcoal font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all duration-300 rounded-full shadow-luxury shimmer"
          >
            Explore our Instagram
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
