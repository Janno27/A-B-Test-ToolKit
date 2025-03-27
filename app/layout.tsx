import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'A/B Test Toolkit',
  description: 'Powerful tools to plan and analyze your A/B tests',
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/ thunbail.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="icon" href="/ thunbail.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
