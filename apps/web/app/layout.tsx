import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import '@fontsource-variable/roboto/index.css';

import './globals.css';

export const metadata: Metadata = {
  title: 'va-framework v2.3.0',
  description:
    'Graph-first single-view analytics workspace with a Les Miserables graph explorer and cars reference workflow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
