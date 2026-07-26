import { motion } from 'motion/react';

export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-transparent">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-serif mb-6 text-charcoal">Where Gold Meets Trust</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-8 shimmer" />
          <p className="text-lg md:text-xl text-charcoal/80 leading-relaxed font-light">
            Located at premium jewellery & fragrances, Aaditya’s Aura, Dalli road, Sankar Nagar, Bhanupratappur, Chhattisgarh 494669, we specialize in premium gold and silver collections,
            exclusive 1G gold varieties, and bespoke fragrance solutions. Our commitment to authenticity and
            craftsmanship ensures that every piece you choose becomes a part of your aesthetic journey.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
