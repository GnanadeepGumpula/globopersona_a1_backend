export function readSearchParams(url: URL) {
  return url.searchParams;
}

export function parsePage(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function parseLimit(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100) {
  const limit = Number(searchParams.get('limit') ?? defaultLimit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return defaultLimit;
  }
  return Math.min(Math.floor(limit), maxLimit);
}