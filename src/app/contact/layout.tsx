import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | SolidStonne Construction',
  description: 'Get in touch with SolidStonne for your next commercial, residential, or civil infrastructure project. Located in Nagpur, Maharashtra.',
  openGraph: {
    title: 'Contact SolidStonne',
    description: 'Ready to build your dream project? Contact our engineering team today.',
  }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
