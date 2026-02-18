import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
  }
  return { 'Content-Type': 'application/json' };
}

async function apiGet(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message || err.error || 'API request failed');
  }
  return res.json();
}

async function apiPost(path, body) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message || err.error || 'API request failed');
  }
  return res.json();
}

async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message || err.error || 'API request failed');
  }
  return res.json();
}

export function fetchMetrics(params) {
  const qs = new URLSearchParams(params).toString();
  return apiGet(`/api/hdb/metrics?${qs}`);
}

export function fetchTransactions(params) {
  const qs = new URLSearchParams(params).toString();
  return apiGet(`/api/hdb/transactions?${qs}`);
}

export function fetchPlanningAreas() {
  return apiGet('/api/areas/planning');
}

export function fetchDistricts() {
  return apiGet('/api/areas/districts');
}

export function fetchWatchlist() {
  return apiGet('/api/areas/watchlist');
}

export function addToWatchlist(area) {
  return apiPost('/api/areas/watchlist', area);
}

export function removeFromWatchlist(id) {
  return apiDelete(`/api/areas/watchlist/${id}`);
}

export function fetchUserProfile() {
  return apiGet('/api/user/profile');
}

export function fetchUserTier() {
  return apiGet('/api/user/tier');
}

export async function exportCsv(params) {
  const headers = await getAuthHeaders();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/hdb/export?${qs}`, { headers });
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}
