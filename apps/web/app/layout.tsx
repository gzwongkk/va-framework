import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import '@fontsource-variable/roboto/index.css';

import './globals.css';

export const metadata: Metadata = {
  title: 'va-framework v2.3.16',
  description:
    'Hierarchy technique suite added to the v2.3 analytics gallery line.',
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
