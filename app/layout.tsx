import type { Metadata } from 'next';
import React from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'Globopersona Backend',
  description: 'Supabase-powered backend for Globopersona marketing operations'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return React.createElement('html', { lang: 'en', className: plusJakartaSans.variable }, React.createElement('body', null, children));
}