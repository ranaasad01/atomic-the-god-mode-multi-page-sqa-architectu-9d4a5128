'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

// Default messages fallback
import enMessages from '@/messages/en.json';

export default function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
