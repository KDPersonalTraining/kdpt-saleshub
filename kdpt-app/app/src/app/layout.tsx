import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KDPT',
  description: 'Coaching with KD Personal Training',
  appleWebApp: { capable: true, title: 'KDPT', statusBarStyle: 'black-translucent' },
};

// maximumScale stops iPhones zooming the page when a text box is tapped; Safari still allows pinch-zoom.
export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
