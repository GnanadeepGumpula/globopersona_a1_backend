import { z } from 'zod';

export const contactStatusSchema = z.enum(['engaged', 'nurture', 'active']);

export const contactCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  status: contactStatusSchema.default('nurture'),
  segmentId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).default({})
});

export const contactUpdateSchema = contactCreateSchema.partial();