import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import '@fontsource-variable/roboto/index.css';

import './globals.css';

export const metadata: Metadata = {
  title: 'va-framework v2.2.8',
  description: 'Single-view analytics workspace with a restored UI studio drawer and a webpack-based dev default for slow filesystems.',
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
