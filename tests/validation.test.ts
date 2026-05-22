import { describe, expect, it } from 'vitest';

import { campaignCreateSchema } from '@/lib/validation/campaign';
import { contactCreateSchema } from '@/lib/validation/contact';
import { settingsUpdateSchema } from '@/lib/validation/settings';

describe('validation schemas', () => {
  it('accepts valid campaign input', () => {
    const result = campaignCreateSchema.parse({
      name: 'Launch',
      subject: 'Welcome',
      content: {}
    });

    expect(result.status).toBe('draft');
  });

  it('accepts valid contact input', () => {
    const result = contactCreateSchema.parse({
      email: 'maya@example.com'
    });

    expect(result.status).toBe('nurture');
  });

  it('accepts valid settings input', () => {
    const result = settingsUpdateSchema.parse({
      companyName: 'Globopersona'
    });

    expect(result.companyName).toBe('Globopersona');
  });
});