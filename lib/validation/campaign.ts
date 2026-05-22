import { z } from 'zod';

export const campaignStatusSchema = z.enum(['draft', 'scheduled', 'live', 'archived']);

export const campaignCreateSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(2),
  previewText: z.string().max(200).optional().nullable(),
  content: z.record(z.unknown()).default({}),
  status: campaignStatusSchema.default('draft'),
  scheduledAt: z.string().datetime().optional().nullable()
});

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  status: campaignStatusSchema.optional()
});

export const campaignScheduleSchema = z.object({
  scheduledAt: z.string().datetime()
});

export const campaignSendSchema = z.object({
  immediate: z.boolean().default(true)
});