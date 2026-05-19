import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarLink',
  description: 'CarLink — la plateforme qui relie conducteurs et garages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
