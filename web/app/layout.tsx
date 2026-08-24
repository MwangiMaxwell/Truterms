import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TruTerms | Know what you\'re agreeing to.',
  description: 'An evidence-first explanation of Terms and Conditions, Privacy Policies, and subscription agreements.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
