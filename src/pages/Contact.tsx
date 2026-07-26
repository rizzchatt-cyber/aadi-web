import { motion } from 'motion/react';
import ContactForm from '../components/Contact';

export default function Contact() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 text-charcoal">Connect with Transparency</h1>
          <p className="text-gold font-serif italic text-lg">We are here to assist you with purity and trust.</p>
          <div className="w-24 h-1 bg-gold mx-auto mt-6 shimmer" />
        </div>

        <ContactForm />
      </div>
    </motion.div>
  );
}
