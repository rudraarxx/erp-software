"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Projects", href: "/projects" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled ? "bg-background/90 backdrop-blur-md border-b border-[#1C1C1C]/10 py-3" : "bg-transparent py-5"
        } px-4 md:px-8`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/ssLogo.png" alt="SolidStonne" width={240} height={70} className="h-12 md:h-16 w-auto object-contain object-left mix-blend-multiply" priority />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href ? "text-[#1C1C1C] font-semibold" : "text-[#1C1C1C]/60 hover:text-[#1C1C1C]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-[#1C1C1C]/60 hover:text-[#1C1C1C] transition-colors">
              Dashboard
            </Link>
            <Link
              href="/contact"
              className="bg-[#1C1C1C] text-white font-medium px-6 py-2.5 rounded-full text-sm hover:bg-primary transition-colors hover:shadow-lg"
            >
              Get a Quote
            </Link>
          </div>

          <button
            className="md:hidden text-[#1C1C1C]"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background flex flex-col pt-20 px-6 pb-6 md:hidden"
          >
            <button
              className="absolute top-6 right-6 text-[#1C1C1C]/70 hover:text-[#1C1C1C]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col gap-6 text-2xl font-heading font-medium mt-12">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    pathname === link.href ? "text-[#1C1C1C]" : "text-[#1C1C1C]/70"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-[#1C1C1C]/10 my-4" />
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#1C1C1C]/70"
              >
                Dashboard
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary font-bold"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
