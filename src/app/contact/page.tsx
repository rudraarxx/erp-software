"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function Contact() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block border border-secondary/30 bg-secondary/10 px-4 py-1.5 rounded-full mb-6"
          >
            <span className="text-secondary text-sm font-medium uppercase tracking-widest">
              Get in Touch
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-heading text-white tracking-tight mb-6"
          >
            Ready to Build Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200">
              Dream Project?
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/70"
          >
            Whether it's a residential complex or heavy infrastructure, SolidStonne has the expertise to deliver. Fill out the form below and our team will get back to you within 24 hours.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Full Name</label>
                  <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Phone Number</label>
                  <input type="tel" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors" placeholder="+91 90000 00000" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email Address</label>
                <input type="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors" placeholder="john@example.com" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Project Type</label>
                <select className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors appearance-none">
                  <option value="" disabled selected>Select Project Type</option>
                  <option value="residential">Residential Construction</option>
                  <option value="commercial">Commercial Construction</option>
                  <option value="industrial">Industrial Facility</option>
                  <option value="infra">Civil Infrastructure</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Project Details</label>
                <textarea rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors resize-none" placeholder="Tell us about your project location, rough budget, and timeline..."></textarea>
              </div>

              <button type="button" className="w-full bg-secondary text-primary font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors group">
                Send Inquiry
                <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-card border border-white/5 rounded-3xl p-8 shadow-xl">
              <h3 className="font-heading font-bold text-2xl text-white mb-8">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Office Address</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      123 Construction Hub, Corporate Road,<br />
                      Nagpur, Maharashtra, 440022
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Phone</h4>
                    <p className="text-white/60 text-sm mb-1">+91 98765 43210</p>
                    <p className="text-white/60 text-sm">+91 91234 56789</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Email</h4>
                    <p className="text-white/60 text-sm">contact@solidstonne.com</p>
                    <p className="text-white/60 text-sm">careers@solidstonne.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-64 rounded-3xl overflow-hidden border border-white/5 relative bg-muted flex items-center justify-center group">
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10" />
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2674&auto=format&fit=crop" 
                alt="Map location" 
                className="w-full h-full object-cover grayscale opacity-50 block"
              />
              <div className="absolute z-20 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-xl flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-secondary" />
                Nagpur Office
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
