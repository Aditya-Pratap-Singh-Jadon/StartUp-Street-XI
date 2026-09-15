export const EVENT_START_ISO = '2026-09-18T18:00:00+05:30'; // 18 Sep 2026, 18:00 IST

export async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error((errData && errData.error) || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function apiSend(path, method, body) {
  const res = await fetch(path, {
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
