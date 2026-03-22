"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Maximize2 } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "Apex Corporate Tower",
    category: "commercial",
    location: "Nagpur, Maharashtra",
    area: "1,20,000 sq.ft",
    year: "2024",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "The Oasis Villas",
    category: "residential",
    location: "Pune, Maharashtra",
    area: "45,000 sq.ft",
    year: "2023",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "MegaTech Manufacturing Hub",
    category: "industrial",
    location: "MIDC Nagpur",
    area: "3,50,000 sq.ft",
    year: "2024 - Ongoing",
    img: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "NH-44 Flyover Expansion",
    category: "infrastructure",
    location: "NH-44 Highway",
    area: "2.4 km span",
    year: "2022",
    img: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=2574&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "Sapphire Heights",
    category: "residential",
    location: "Nagpur, Maharashtra",
    area: "85,000 sq.ft",
    year: "2021",
    img: "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?q=80&w=2674&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Alpha Tech Park",
    category: "commercial",
    location: "Mumbai, Maharashtra",
    area: "4,00,000 sq.ft",
    year: "2025 - Ongoing",
    img: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=2574&auto=format&fit=crop"
  }
];

const filters = [
  { id: "all", label: "All Projects" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "industrial", label: "Industrial" },
  { id: "infrastructure", label: "Infrastructure" }
];

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredProjects = projects.filter(project => 
    activeFilter === "all" ? true : project.category === activeFilter
  );

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block border border-secondary/30 bg-secondary/10 px-4 py-1.5 rounded-full mb-6"
          >
            <span className="text-secondary text-sm font-medium uppercase tracking-widest">
              Our Portfolio
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-heading text-white tracking-tight mb-6"
          >
            Showcasing Our <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200">
              Finest Work
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/70"
          >
            A curated selection of our completed and ongoing projects across residential, commercial, and industrial sectors.
          </motion.p>
        </div>

        {/* Filter Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter.id 
                  ? "bg-secondary text-primary shadow-[0_0_15px_rgba(232,160,32,0.3)]" 
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                  <Image 
                    src={project.img} 
                    alt={project.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-secondary/90 flex items-center justify-center text-primary transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                      <Maximize2 className="w-6 h-6" />
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-background/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold font-heading text-white mb-2 group-hover:text-secondary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
                    <span>{project.area}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                    <span>{project.year}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-20 text-white/50">
            No projects found for this category.
          </div>
        )}

      </div>
    </main>
  );
}
