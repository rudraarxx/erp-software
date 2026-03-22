"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Shield, Users, Target } from "lucide-react";

export default function About() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-8 mb-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block border border-secondary/30 bg-secondary/10 px-4 py-1.5 rounded-full mb-6"
          >
            <span className="text-secondary text-sm font-medium uppercase tracking-widest">
              Our Story
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-heading text-white tracking-tight mb-6"
          >
            Building Trust Through <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200">
              Uncompromising Quality
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/70"
          >
            Founded with a vision to revolutionize the construction industry in Central India, SolidStonne has grown into a premier civil engineering and construction firm known for delivering large-scale, complex projects on time.
          </motion.p>
        </div>
      </section>

      {/* Origin Story & Image */}
      <section className="container mx-auto px-4 md:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2671&auto=format&fit=crop"
              alt="SolidStonne construction site"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold font-heading text-white mb-6">A Legacy of Engineering Excellence</h2>
            <div className="space-y-4 text-white/70 text-lg leading-relaxed mb-8">
              <p>
                What started as a small contracting firm has now transformed into a multi-disciplinary construction powerhouse. At SolidStonne, we don't just build structures; we construct the backbone of communities.
              </p>
              <p>
                Our expertise spans across residential high-rises, expansive commercial facilities, and critical civil infrastructure. Emphasizing modern construction management technologies, we ensure unprecedented transparency for our clients from the first brick to the final handover.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-white/10 bg-card p-6 rounded-2xl">
                <Target className="w-8 h-8 text-secondary mb-4" />
                <h3 className="text-white font-bold mb-2">Our Mission</h3>
                <p className="text-white/60 text-sm">To deliver structurally superior projects that exceed client expectations in quality and speed.</p>
              </div>
              <div className="border border-white/10 bg-card p-6 rounded-2xl">
                <Shield className="w-8 h-8 text-secondary mb-4" />
                <h3 className="text-white font-bold mb-2">Our Vision</h3>
                <p className="text-white/60 text-sm">To be the most trusted name in Indian construction infrastructure and project management.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="bg-card py-24 border-y border-white/5">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Users className="w-12 h-12 text-secondary mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">Leadership Team</h2>
            <p className="text-white/70 text-lg">
              Navigated by industry veterans with decades of combined experience in heavy civil engineering and corporate management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Rajesh Sontakke", role: "Managing Director", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2574&auto=format&fit=crop" },
              { name: "Amit Sharma", role: "Chief Engineer", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=2574&auto=format&fit=crop" },
              { name: "Priya Desai", role: "Head of Project Management", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop" }
            ].map((person, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group text-center"
              >
                <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-secondary/20 group-hover:border-secondary transition-colors">
                  <Image src={person.img} alt={person.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{person.name}</h3>
                <p className="text-secondary font-medium">{person.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="container mx-auto px-4 md:px-8 py-24 text-center">
        <h2 className="text-sm font-medium tracking-widest uppercase text-secondary mb-8">Registrations & Accreditations</h2>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale">
          {/* Placeholder for logos */}
          <div className="text-2xl font-bold text-white font-heading">ISO 9001:2015</div>
          <div className="text-2xl font-bold text-white font-heading">PWD Class 1-A</div>
          <div className="text-2xl font-bold text-white font-heading">MSME Certified</div>
          <div className="text-2xl font-bold text-white font-heading">IGBC Member</div>
        </div>
      </section>

    </main>
  );
}
