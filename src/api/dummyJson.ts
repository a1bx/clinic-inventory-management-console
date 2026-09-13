const API_BASE = 'https://dummyjson.com';

export interface ApiUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image?: string;
}

export interface ApiProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  brand?: string;
  sku?: string;
  thumbnail?: string;
  minimumOrderQuantity?: number;
  meta?: { createdAt?: string; updatedAt?: string };
}

interface ApiResponse<T> {
  products?: T[];
  total?: number;
  skip?: number;
  limit?: number;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the status-based message when the server does not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function login(username: string, password: string): Promise<Session> {
  const tokens = await request<{ accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, expiresInMins: 1 }),
  });
  const user = await request<ApiUser>('/auth/me', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  return { ...tokens, user };
}

export async function refreshSession(refreshToken: string): Promise<Session> {
  const tokens = await request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken, expiresInMins: 1 }),
  });
  const user = await request<ApiUser>('/auth/me', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  return { ...tokens, user };
}

export async function getProducts(
  accessToken: string,
  params: { limit?: number; skip?: number; sortBy?: string; order?: string; signal?: AbortSignal } = {},
): Promise<ApiResponse<ApiProduct>> {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 194),
    skip: String(params.skip ?? 0),
  });
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.order) query.set('order', params.order);
  return request<ApiResponse<ApiProduct>>(`/products?${query}`, {
    signal: params.signal,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function searchProducts(
  accessToken: string,
  query: string,
  signal?: AbortSignal,
): Promise<ApiResponse<ApiProduct>> {
  return request<ApiResponse<ApiProduct>>(`/products/search?q=${encodeURIComponent(query)}`, {
    signal,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getProduct(accessToken: string, id: string): Promise<ApiProduct> {
  return request<ApiProduct>(`/products/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function updateProduct(
  accessToken: string,
  id: string,
  stock: number,
): Promise<ApiProduct> {
  return request<ApiProduct>(`/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ stock }),
  });
}

export async function getCategories(accessToken: string): Promise<string[]> {
  return request<string[]>('/products/categories', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
