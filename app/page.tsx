import React from 'react';

export default function HomePage() {
  return React.createElement(
    'main',
    { style: { fontFamily: 'system-ui, sans-serif', padding: '2rem' } },
    React.createElement('h1', null, 'Globopersona Backend'),
    React.createElement('p', null, 'Supabase-backed API routes are ready under /api.')
  );
}