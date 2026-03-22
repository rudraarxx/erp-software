import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services | SolidStonne Construction',
  description: 'Comprehensive civil construction services spanning residential high-rises, commercial spaces, industrial manufacturing hubs, and heavy infrastructure.',
  openGraph: {
    title: 'Engineering Solutions by SolidStonne',
    description: 'We offer Residential, Commercial, Industrial, and Infrastructure construction services.',
  }
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
