export const EVENT_START_ISO = '2026-09-18T18:00:00+05:30'; // 18 Sep 2026, 18:00 IST

const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiGet(path) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error((errData && errData.error) || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function apiSend(path, method, body) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error((errData && errData.error) || `Request failed (${res.status})`);
  }
  return res.json();
}

export function originUrl() {
  return window.location.origin;
}

export function inviteLink(code) {
  return `${originUrl()}/join-team/${code}`;
}
