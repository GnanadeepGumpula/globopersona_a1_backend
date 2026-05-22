import { vi } from 'vitest';

export type MockResult = {
  data?: unknown;
  count?: number;
  error?: null | { message: string };
};

export function createSupabaseMock(results: Record<string, MockResult[]>) {
  const calls: Array<{ table: string; action: string; payload?: unknown }> = [];

  function nextResult(table: string): MockResult {
    const queue = results[table] ?? [];
    const result = queue.shift() ?? { data: null, error: null };
    results[table] = queue;
    return result;
  }

  function buildChain(table: string) {
    const state = { action: 'select', payload: undefined as unknown };
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      or: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      not: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      insert: vi.fn((payload: unknown) => {
        state.action = 'insert';
        state.payload = payload;
        calls.push({ table, action: state.action, payload });
        return chain;
      }),
      update: vi.fn((payload: unknown) => {
        state.action = 'update';
        state.payload = payload;
        calls.push({ table, action: state.action, payload });
        return chain;
      }),
      upsert: vi.fn((payload: unknown) => {
        state.action = 'upsert';
        state.payload = payload;
        calls.push({ table, action: state.action, payload });
        return chain;
      }),
      single: vi.fn(async () => nextResult(table)),
      maybeSingle: vi.fn(async () => nextResult(table)),
      then: (resolve: (value: MockResult) => unknown, reject: (reason: unknown) => unknown) => {
        const result = nextResult(table);
        return Promise.resolve(result).then(resolve, reject);
      }
    };

    calls.push({ table, action: state.action });
    return chain;
  }

  return {
    calls,
    from: vi.fn((table: string) => buildChain(table))
  };
}