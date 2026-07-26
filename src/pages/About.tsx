import { motion } from 'motion/react';
import { LazyImage } from '../components/LazyImage';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 text-charcoal">Our Story of Trust & Craftsmanship</h1>
          <div className="w-24 h-1 bg-gold mx-auto shimmer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-charcoal/80 leading-relaxed"
          >
            <p className="text-xl font-serif text-gold italic">Transparency is our legacy.</p>
            <p>
              Aaditya’s Aura was founded on the principles of absolute transparency and unwavering trust.
              In an industry where purity is paramount, we have made it our mission to provide only the
              finest hallmarked Jewellery, premium Attar, and exquisite Perfume, ensuring that every customer
              knows exactly what they are investing in.
            </p>
            <p>
              Our showroom at premium Jewellery, Attar & Perfume, Aaditya’s Aura, Dalli road, Sankar Nagar, Bhanupratappur, Chhattisgarh 494669 is more than a retail space; it is a sanctuary of
              authenticity. From our 22K gold collections to our exclusive 1G gold varieties, every piece
              undergoes rigorous quality checks to meet the highest standards of craftsmanship.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-gold/20 shadow-2xl aspect-square"
          >
            <LazyImage src="https://iili.io/qKjxw41.png" alt="Aaditya's Aura Craftsmanship" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gold/5" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-8 bg-luxury-cream/30 rounded-2xl border border-gold/10">
            <h3 className="text-gold font-serif text-xl mb-4">Purity Guaranteed</h3>
            <p className="text-sm text-charcoal/60">Every gram is accounted for with official hallmark certification.</p>
          </div>
          <div className="p-8 bg-luxury-cream/30 rounded-2xl border border-gold/10">
            <h3 className="text-gold font-serif text-xl mb-4">Transparent Pricing</h3>
            <p className="text-sm text-charcoal/60">No hidden costs. We believe in honest business with every client.</p>
          </div>
          <div className="p-8 bg-luxury-cream/30 rounded-2xl border border-gold/10">
            <h3 className="text-gold font-serif text-xl mb-4">Customer Commitment</h3>
            <p className="text-sm text-charcoal/60">Your satisfaction and trust are the true measures of our success.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
