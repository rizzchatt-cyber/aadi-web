import { motion } from 'motion/react';
import { Award, Droplets, Gem, Truck } from 'lucide-react';
import Reveal from './Reveal';

const features = [
  { icon: Award, title: 'Hallmarked Quality', desc: 'Every piece is certified for absolute purity and trust.' },
  { icon: Droplets, title: 'Custom Fragrance', desc: 'Bespoke scents crafted with luxury and integrity.' },
  { icon: Gem, title: '1G Gold Varieties', desc: 'Authenticity in every gram, designed for elegance.' },
  { icon: Truck, title: 'Trusted Delivery', desc: 'Safe, transparent, and insured shipping nationwide.' },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-32 px-4 md:px-6 bg-luxury-cream/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {features.map((item, idx) => (
            <div key={item.title} className="w-full">
              <Reveal delay={idx * 0.1} direction="up" distance={20}>
                <motion.div
                  whileHover={{ y: -15, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-8 md:p-12 rounded-[32px] md:rounded-[40px] border-luxury bg-white text-center group shadow-premium hover:shadow-luxury transition-all duration-700 h-full flex flex-col items-center transform-gpu"
                >
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gold/5 rounded-full flex items-center justify-center mb-6 md:mb-10 group-hover:bg-gold/10 transition-colors duration-700 relative">
                    <div className="absolute inset-0 rounded-full border border-gold/10 group-hover:border-gold/30 scale-110 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                    <item.icon className="text-gold group-hover:scale-110 transition-transform duration-700" size={32} />
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-serif mb-4 md:mb-5 text-charcoal tracking-tight transition-colors group-hover:text-gold leading-tight">{item.title}</h3>
                  <div className="w-12 h-px bg-gold/10 mb-4 md:mb-6 group-hover:w-24 group-hover:bg-gold transition-all duration-1000" />
                  <p className="text-charcoal/45 text-sm md:text-base leading-relaxed font-light italic">{item.desc}</p>
                </motion.div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
