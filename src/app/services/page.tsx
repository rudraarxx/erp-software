"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Building2, Factory, HardHat, Home, Cone, Ruler } from "lucide-react";
import Link from "next/link";

export default function Services() {
  const services = [
    {
      id: "residential",
      title: "Residential Construction",
      desc: "From bespoke luxury villas to high-rise apartment complexes, we build homes that combine aesthetic brilliance with structural integrity. Our residential projects feature premium finishes and smart space utilization.",
      icon: Home,
      features: ["Custom Bungalows", "Multi-family Residential", "Turnkey Capabilities", "Premium Finishing"],
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
    },
    {
      id: "commercial",
      title: "Commercial Spaces",
      desc: "We deliver cutting-edge commercial properties including corporate offices, retail malls, and hospitality centers. Our focus is on creating energy-efficient, scalable spaces that drive business growth.",
      icon: Building2,
      features: ["Office Complexes", "Retail Centers", "Hotels & Resorts", "Green Building Standards"],
      img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop"
    },
    {
      id: "industrial",
      title: "Industrial & Manufacturing",
      desc: "Heavy-duty construction requires specialized engineering. We construct large-scale factories, massive warehouses, and specialized manufacturing facilities designed to support heavy machinery and logistical flow.",
      icon: Factory,
      features: ["Warehouses", "Manufacturing Plants", "Cold Storage", "Heavy Duty Flooring"],
      img: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop"
    },
    {
      id: "infrastructure",
      title: "Civil Infrastructure",
      desc: "Laying the groundwork for progress. Our civil infrastructure division handles complex earthworks, road networks, major drainage systems, and retaining wall construction.",
      icon: Cone,
      features: ["Road Networks", "Drainage Systems", "Retaining Walls", "Earthworks"],
      img: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=2574&auto=format&fit=crop"
    },
    {
      id: "renovation",
      title: "Renovation & Retrofitting",
      desc: "Breathing new life into aging structures. We provide comprehensive structural retrofitting, facade upgrades, and core renovations to extend the lifespan of existing buildings.",
      icon: HardHat,
      features: ["Structural Strengthening", "Facade Modernization", "Core Upgrades", "MEP Retrofitting"],
      img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop"
    },
    {
      id: "pmc",
      title: "Project Management Consulting",
      desc: "Leveraging our integrated ERP platform, we offer end-to-end PMC services. From vendor management and BOQ optimization to strict timeline adherence, we manage the entire lifecycle on behalf of the client.",
      icon: Ruler,
      features: ["Contract Management", "Quality Assurance", "Cost Optimization", "Timeline Tracking"],
      img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2670&auto=format&fit=crop"
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      
      <div className="container mx-auto px-4 md:px-8 mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block border border-secondary/30 bg-secondary/10 px-4 py-1.5 rounded-full mb-6"
        >
          <span className="text-secondary text-sm font-medium uppercase tracking-widest">
            Core Competencies
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold font-heading text-white tracking-tight mb-6"
        >
          Engineering Solutions for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200">
            Every Scale & Sector
          </span>
        </motion.h1>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="space-y-32">
          {services.map((service, index) => {
            const isEven = index % 2 === 0;
            const Icon = service.icon;

            return (
              <motion.div 
                key={service.id}
                id={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center ${isEven ? "" : "lg:flex-row-reverse"}`}
              >
                {/* Image Side */}
                <div className={`relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ${isEven ? "order-1 lg:order-1" : "order-1 lg:order-2"}`}>
                  <Image src={service.img} alt={service.title} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                </div>

                {/* Content Side */}
                <div className={`${isEven ? "order-2 lg:order-2" : "order-2 lg:order-1"}`}>
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                    <Icon className="w-8 h-8 text-secondary" />
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-6">
                    {service.title}
                  </h2>
                  
                  <p className="text-white/70 text-lg leading-relaxed mb-8">
                    {service.desc}
                  </p>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/90 font-medium bg-card px-4 py-3 rounded-xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/contact" className="inline-flex items-center gap-2 text-secondary font-bold hover:text-white transition-colors group">
                    Discuss this service
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="mt-32 max-w-4xl mx-auto px-4 md:px-8 text-center">
        <div className="bg-gradient-to-br from-card to-background border border-secondary/20 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-secondary/5" />
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-6 relative z-10">
            Require specialized construction expertise?
          </h2>
          <p className="text-white/70 text-lg mb-8 relative z-10 max-w-2xl mx-auto">
            Our technical team is ready to analyze your drawings and provide a comprehensive execution strategy.
          </p>
          <Link href="/contact" className="relative z-10 inline-flex items-center justify-center gap-2 bg-secondary text-primary font-bold px-8 py-4 rounded-full text-base hover:bg-white transition-colors">
            Request a Consultation
          </Link>
        </div>
      </div>

    </main>
  );
}
