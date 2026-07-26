import { motion } from 'motion/react';
import logo from '../assets/logo.png';

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-luxury-white flex flex-col items-center justify-center"
    >
      <div className="relative flex flex-col items-center">
        {/* Soft Gold Glow behind logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.5 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-gold/10 blur-3xl rounded-full"
        />

        <motion.img
          src={logo}
          alt="Aaditya's Aura Logo"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
          transition={{
            duration: 2,
            ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for smooth entry
          }}
          className="w-40 md:w-64 relative z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-6 text-center relative z-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold gold-text-gradient tracking-widest">
            Aaditya’s Aura
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
            className="h-0.5 bg-gold w-full mt-2 origin-center"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
