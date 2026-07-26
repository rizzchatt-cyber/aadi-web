import { useState, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, MapPin, Send, MessageCircle, Mail } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    product: 'Gold Jewellery',
    message: ''
  });
  const [showOptions, setShowOptions] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      alert("Please fill in your name and message.");
      return;
    }
    setShowOptions(true);
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(`*Contact Inquiry*\n\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Product:* ${formData.product}\n*Message:* ${formData.message}`);
    window.open(`https://wa.me/918653535303?text=${text}`, '_blank');
    setShowOptions(false);
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Aura Inquiry from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nPhone: ${formData.phone}\nProduct: ${formData.product}\n\nMessage:\n${formData.message}`);

    const mailtoUrl = `mailto:aadityasaura@gmail.com?subject=${subject}&body=${body}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=aadityasaura@gmail.com&su=${subject}&body=${body}`;

    // Detect mobile vs desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = mailtoUrl;
    } else {
      window.open(gmailUrl, '_blank');
    }

    setShowOptions(false);

    setFormData({
      name: '',
      phone: '',
      product: 'Gold Jewellery',
      message: ''
    });
  };

  return (
    <section id="contact" className="py-24 px-6 bg-luxury-cream/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:block"
          >
            <h2 className="text-4xl font-serif mb-8 text-charcoal">Get In Touch</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/5 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="text-gold" />
                </div>
                <div>
                  <h4 className="text-charcoal font-serif text-lg">Location</h4>
                  <p className="text-charcoal/60">premium Jewellery, Attar & Perfume, Aaditya’s Aura, Dalli road, Sankar Nagar, Bhanupratappur, Chhattisgarh 494669</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/5 rounded-full flex items-center justify-center shrink-0">
                  <Instagram className="text-gold" />
                </div>
                <div>
                  <h4 className="text-charcoal font-serif text-lg">Instagram</h4>
                  <a href="https://instagram.com/aadityas.aura" className="text-charcoal/60 hover:text-gold transition-colors">@aadityas.aura</a>
                </div>
              </div>

              <div className="pt-8">
                <motion.a
                  href="https://wa.me/918653535303?text=I%20am%20interested%20in%20your%20Jewellery%2C%20Attar%20%26%20Perfume%20collection"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#e6c669] text-white font-bold rounded-full shadow-lg shadow-gold/20 hover:brightness-105 transition-all"
                >
                  <MessageCircle size={24} />
                  Quick Chat on WhatsApp
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-luxury-white border border-gold/10 shadow-xl relative overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gold">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-3 bg-luxury-cream/50 border border-gold/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-charcoal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gold">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your Phone Number"
                  className="w-full px-4 py-3 bg-luxury-cream/50 border border-gold/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-charcoal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gold">Product Interested In</label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-luxury-cream/50 border border-gold/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all appearance-none text-charcoal"
                >
                  <option value="Gold Jewellery" className="bg-luxury-white">Gold Jewellery</option>
                  <option value="Silver Jewellery" className="bg-luxury-white">Silver Jewellery</option>
                  <option value="1G Gold Collection" className="bg-luxury-white">1G Gold Collection</option>
                  <option value="Perfumes & Attars" className="bg-luxury-white">Perfumes & Attars</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gold">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="How can we help you?"
                  required
                  className="w-full px-4 py-3 bg-luxury-cream/50 border border-gold/10 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-charcoal"
                />
              </div>

              <AnimatePresence mode="wait">
                {!showOptions ? (
                  <motion.button
                    key="send-btn"
                    type="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full py-4 gold-gradient text-luxury-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-gold/10 shimmer"
                  >
                    Send Message
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3 pt-4"
                  >
                    <p className="text-center text-gold font-bold text-sm mb-4 uppercase tracking-widest">Select Sending Method</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={sendWhatsApp}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#25D366] text-white rounded-2xl shadow-lg hover:brightness-110 transition-all font-bold group"
                      >
                        <MessageCircle size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs uppercase tracking-tighter">WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={sendEmail}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-charcoal text-white rounded-2xl shadow-lg hover:bg-gold transition-all font-bold group"
                      >
                        <Mail size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs uppercase tracking-tighter">Gmail / Email</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setShowOptions(false)}
                      className="w-full py-2 text-charcoal/40 text-[10px] font-bold uppercase tracking-widest hover:text-gold transition-colors"
                    >
                      ← Back to edit
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
