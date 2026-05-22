import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Globopersona Backend',
  description: 'Supabase-powered backend for Globopersona marketing operations'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return React.createElement('html', { lang: 'en' }, React.createElement('body', null, children));
}