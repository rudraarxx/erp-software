import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail, ArrowRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-[#1C1C1C]/10 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              <Image src="/brand_img.png" alt="SolidStonne" width={280} height={120} className="h-16 md:h-24 w-auto object-contain object-left mix-blend-multiply" />
            </Link>
            <p className="text-[#1C1C1C]/60 text-sm leading-relaxed max-w-xs">
              Premium civil construction, commercial infrastructure, and industrial solutions in Nagpur, Maharashtra.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[#1C1C1C]/10 flex items-center justify-center text-[#1C1C1C]/70 hover:bg-[#1C1C1C] hover:text-white hover:border-[#1C1C1C] transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#1C1C1C]/10 flex items-center justify-center text-[#1C1C1C]/70 hover:bg-[#1C1C1C] hover:text-white hover:border-[#1C1C1C] transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#1C1C1C]/10 flex items-center justify-center text-[#1C1C1C]/70 hover:bg-[#1C1C1C] hover:text-white hover:border-[#1C1C1C] transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg text-[#1C1C1C] mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Our Services", href: "/services" },
                { name: "Projects Portfolio", href: "/projects" },
                { name: "Contact us", href: "/contact" }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-[#1C1C1C]/60 hover:text-primary text-sm flex items-center gap-2 group transition-colors">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg text-[#1C1C1C] mb-6">Our Services</h4>
            <ul className="space-y-3">
              {[
                "Residential Construction",
                "Commercial Construction",
                "Industrial Facilities",
                "Civil Infrastructure",
                "Renovation & Retrofitting"
              ].map((service, i) => (
                <li key={i}>
                  <Link href="/services" className="text-[#1C1C1C]/60 hover:text-primary text-sm flex items-center gap-2 group transition-colors">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg text-[#1C1C1C] mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-[#1C1C1C]/60">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>123 Construction Hub, Corporate Road, Nagpur, Maharashtra, 440022</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1C1C1C]/60">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1C1C1C]/60">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>contact@solidstonne.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-[#1C1C1C]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#1C1C1C]/40 text-xs text-center md:text-left">
            © {new Date().getFullYear()} SolidStonne Construction. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-[#1C1C1C]/40">
            <Link href="/privacy" className="hover:text-[#1C1C1C] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1C1C1C] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
