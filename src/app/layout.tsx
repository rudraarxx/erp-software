import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/global/CustomCursor";
import { SmoothScroll } from "@/components/global/SmoothScroll";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolidStonne - Civil Construction Management",
  description: "Premium civil construction, commercial, and infra solutions in Nagpur, Maharashtra.",
  keywords: ["construction company Nagpur", "civil contractor Nagpur", "building contractor Maharashtra"],
  openGraph: {
    title: "SolidStonne Construction & Civil Engineering",
    description: "Building trust through uncompromising quality in Central India.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${sora.variable} antialiased`}
      >
        <SmoothScroll>
          <CustomCursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
