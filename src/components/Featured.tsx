import { motion } from 'motion/react';
import { LazyImage } from './LazyImage';

export default function Featured() {
  return (
    <section id="collections" className="py-24 px-6 bg-luxury-cream/40">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif mb-4 text-charcoal">Premium Gold Collection</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full shimmer" />
        </motion.div>

        <div className="relative group max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10 rounded-2xl overflow-hidden border border-gold/20 shadow-xl bg-luxury-white"
          >
            <div className="absolute inset-0 bg-gold/5 group-hover:bg-transparent transition-colors duration-500" />
            <LazyImage 
              src="https://picsum.photos/seed/jewellery-necklace/1200/800" 
              alt="Featured Necklace" 
              className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-linear-to-t from-luxury-white via-luxury-white/80 to-transparent text-left">
              <p className="text-gold font-serif text-xl italic">The Royal Heritage Necklace</p>
              <p className="text-charcoal/70 text-sm">Crafted with 22K Hallmarked Gold & Precious Stones</p>
            </div>
          </motion.div>
          
          {/* Decorative Frame */}
          <div className="absolute -inset-4 border border-gold/10 rounded-3xl -z-10 group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute -inset-8 border border-gold/5 rounded-[2rem] -z-10 group-hover:scale-110 transition-transform duration-700" />
          
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full -z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
      </div>
    </section>
  );
}
