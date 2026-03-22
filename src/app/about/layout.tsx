import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | SolidStonne Construction',
  description: 'Learn about SolidStonne\'s history, our engineering legacy, mission, and our veteran leadership team.',
  openGraph: {
    title: 'About SolidStonne',
    description: 'Premier civil engineering and construction firm in Central India.',
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
