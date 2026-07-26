import { motion } from 'motion/react';
import { Heart, MessageCircle } from 'lucide-react';
import { LazyImage } from './LazyImage';

const galleryItems: any[] = [];

export default function InstagramGrid() {
  return (
    <section id="gallery" className="py-24 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-serif mb-4 text-charcoal">Our Gallery</h2>
          <p className="text-charcoal/60">Follow our journey on Instagram @aadityas.aura</p>
        </motion.div>

        <div className={galleryItems.length > 0 ? "grid grid-cols-1 md:grid-cols-3 gap-8" : "text-center py-20"}>
          {galleryItems.length > 0 ? galleryItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-luxury-white rounded-xl overflow-hidden border border-gold/10 shadow-md hover:shadow-xl hover:shadow-gold/5 transition-all duration-500"
            >
              <div className="relative aspect-square overflow-hidden">
                <LazyImage
                  src={item.img}
                  alt={item.caption}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-luxury-white">
                    <Heart size={24} fill="white" />
                    <span className="font-bold">{item.likes}</span>
                  </div>
                  <div className="flex items-center gap-2 text-luxury-white">
                    <MessageCircle size={24} fill="white" />
                    <span className="font-bold">{item.comments}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-charcoal text-sm line-clamp-2">{item.caption}</p>
              </div>
            </motion.div>
          )) : (
            <div className="max-w-md mx-auto">
              <p className="text-xl font-serif text-charcoal/40 italic mb-4">Our gallery is currently being curated with fresh moments of luxury.</p>
              <div className="w-16 h-px bg-gold/30 mx-auto" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
