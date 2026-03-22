"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { homeData } from "@/lib/data/home";
import { Navbar } from "@/components/global/Navbar";
import { Footer } from "@/components/global/Footer";
import { cn } from "@/lib/utils";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax value for the main hero image
  const yHeroImg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <>
      <Navbar />
      <main ref={containerRef} className="min-h-screen bg-background text-secondary">
        
        {/* HERO SECTION */}
        <section className="pt-32 pb-16 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            
            {/* Main Headline */}
            <div className="lg:col-span-8">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-7xl lg:text-[7.5rem] leading-[0.9] font-heading font-medium tracking-tight text-[#1C1C1C]"
              >
                {homeData.hero.headline.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-12 flex items-center gap-2 font-medium text-[#1C1C1C] hover:text-primary transition-colors w-fit border-b border-[#1C1C1C]/20 hover:border-primary pb-1"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  {homeData.hero.ctaText}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Intro Content */}
            <div className="lg:col-span-4 flex flex-col justify-end lg:pl-8">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm mb-6">
                  <Image 
                    src={homeData.hero.smallImage} 
                    alt="House Build Preview" 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
                <p className="text-[#1C1C1C]/80 leading-relaxed text-sm max-w-sm">
                  {homeData.hero.introText}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Huge Hero Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-[50vh] lg:h-[70vh] relative overflow-hidden rounded-sm group"
          >
            <motion.div style={{ y: yHeroImg }} className="absolute -inset-y-10 inset-x-0 w-full h-[120%]">
              <Image 
                src={homeData.hero.mainImage} 
                alt="Architecture Hero" 
                fill 
                className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                priority
              />
            </motion.div>
          </motion.div>
        </section>

        {/* STATS SECTION */}
        <section className="py-24 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto border-t border-border mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-12">
            
            {/* Projects Stat */}
            <div className="space-y-8 max-w-lg">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 mb-4 block">Projects</span>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="text-7xl sm:text-8xl font-heading font-light text-[#1C1C1C] mb-6"
                >
                  {homeData.stats.projects}
                </motion.h2>
                <p className="text-[#1C1C1C]/70 text-sm leading-relaxed max-w-xs">{homeData.stats.projectsText}</p>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative aspect-[3/4] w-full max-w-sm overflow-hidden"
              >
                <Image src={homeData.stats.projectsImage} alt="Projects" fill className="object-cover" />
              </motion.div>
            </div>

            {/* Clients Stat */}
            <div className="space-y-8 max-w-lg lg:mt-32 ml-auto">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 mb-4 block">Clients</span>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="text-7xl sm:text-8xl font-heading font-light text-[#1C1C1C] mb-6"
                >
                  {homeData.stats.clients}
                </motion.h2>
                <p className="text-[#1C1C1C]/70 text-sm leading-relaxed max-w-xs">{homeData.stats.clientsText}</p>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-square w-full max-w-md overflow-hidden"
              >
                <Image src={homeData.stats.clientsImage} alt="Clients" fill className="object-cover" />
              </motion.div>
            </div>

          </div>
        </section>

        {/* FEATURED PROJECTS */}
        <section className="py-32 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
          <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 mb-16 block">Our Projects</span>
          
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 h-[600px]">
            {homeData.ourProjects.map((project, i) => (
              <ProjectColumn key={project.id} project={project} index={i} />
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <ServicesSection />

        {/* TESTIMONIALS */}
        <section className="py-32 px-4 md:px-8 max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 mb-12 block">What Our Clients Say About Us</span>
          <motion.blockquote 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-heading font-medium leading-[1.4] text-[#1C1C1C] mb-12"
          >
            "{homeData.testimonial.text}"
          </motion.blockquote>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="font-bold text-[#1C1C1C] text-sm uppercase tracking-wider">{homeData.testimonial.author}</div>
            <div className="text-[#1C1C1C]/60 text-xs mt-1">{homeData.testimonial.role}</div>
          </motion.div>
        </section>

        {/* BLOG & NEWS */}
        <section className="py-24 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto border-t border-border">
          <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 mb-12 block">Blog & News</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeData.blog.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden mb-6">
                  <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105 grayscale hover:grayscale-0" 
                  />
                </div>
                <h3 className="text-xl font-heading font-medium text-[#1C1C1C] mb-3">{post.title}</h3>
                <p className="text-[#1C1C1C]/70 text-sm mb-6 leading-relaxed line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase border-b border-transparent group-hover:border-[#1C1C1C] w-fit transition-all pb-1">
                  Read more
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </motion.article>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS FOR HOMEPAGE
// -------------------------------------------------------------

function ProjectColumn({ project, index }: { project: any, index: number }) {
  // Using Framer Motion to animate the large numbers and project images
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="flex flex-col flex-1 h-full relative group cursor-pointer border-l border-border/50 pl-6 first:border-l-0 first:pl-0"
    >
      <div className="text-[6rem] sm:text-[8rem] lg:text-[10rem] leading-none font-light text-[#1C1C1C]/20 transition-colors group-hover:text-primary mb-auto">
        {project.id}
      </div>
      
      {/* Hidden initially, revealed on hover on desktop, always visible on mobile/tablet maybe? Let's use opacity */}
      <div className="absolute inset-0 top-32 bottom-24 overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 scale-95 group-hover:scale-100">
        <Image src={project.image} alt={project.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="mt-8 relative z-20">
        <h3 className="font-heading font-medium text-lg text-[#1C1C1C] mb-1">{project.title}</h3>
        <p className="text-xs text-[#1C1C1C]/60 uppercase tracking-wider">{project.subtitle}</p>
        <ArrowUpRight className="w-5 h-5 absolute right-0 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

function ServicesSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto border-t border-border flex flex-col lg:flex-row gap-16 relative">
      <div className="lg:w-1/4">
        <span className="text-xs font-bold tracking-widest uppercase text-[#1C1C1C]/60 block sticky top-32">Services We Provide</span>
      </div>

      <div className="lg:w-3/4 flex flex-col justify-center">
        {homeData.services.map((service, idx) => (
          <div 
            key={idx}
            className="group relative border-b border-border py-8 lg:py-10 cursor-pointer flex items-center justify-between"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <h3 className={cn(
              "text-3xl sm:text-4xl lg:text-5xl font-heading font-light transition-colors duration-300",
              hoveredIdx === idx ? "text-primary font-medium" : "text-[#1C1C1C]/40"
            )}>
              {service.title}
            </h3>
            
            <ArrowUpRight className={cn(
              "w-6 h-6 transition-all duration-300",
              hoveredIdx === idx ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-4"
            )} />

            {/* Hover Image Reveal */}
            {service.image && hoveredIdx === idx && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[300px] aspect-[4/3] z-10 pointer-events-none rounded-sm overflow-hidden shadow-2xl hidden lg:block"
              >
                <Image src={service.image} alt={service.title} fill className="object-cover" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
