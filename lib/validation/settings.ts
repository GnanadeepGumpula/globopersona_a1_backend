import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2).optional(),
  replyToEmail: z.string().email().optional(),
  defaultSenderName: z.string().min(1).optional(),
  sendingDomain: z.string().min(1).optional().nullable(),
  timezone: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
  preferences: z.record(z.unknown()).optional()
});