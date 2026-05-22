import { ZodError } from 'zod';

import { jsonError } from '@/lib/api/response';

export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError('Validation failed', 422, error.flatten());
  }

  console.error(error);
  return jsonError('Internal server error', 500);
}