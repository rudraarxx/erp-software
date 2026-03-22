import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Portfolio | SolidStonne Projects',
  description: 'Browse our curated selection of completed and ongoing construction projects across residential, commercial, and industrial sectors in Maharashtra.',
  openGraph: {
    title: 'SolidStonne Project Portfolio',
    description: 'Showcasing our finest work in building world-class infrastructure.',
  }
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
