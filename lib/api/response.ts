import { NextResponse } from 'next/server';

export type ApiErrorBody = {
  error: {
    message: string;
    details?: unknown;
  };
};

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  const body: ApiErrorBody = {
    error: {
      message,
      ...(details === undefined ? {} : { details })
    }
  };

  return NextResponse.json(body, { status });
}