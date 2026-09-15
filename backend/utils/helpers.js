import { prisma } from '../config/database.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function checkAdmin(admin_id) {
  if (!admin_id) return false;
  const p = await prisma.profile.findUnique({ where: { id: admin_id }, select: { role: true } });
  return p?.role === 'admin' || p?.role === 'superadmin';
}

export async function checkSuperadmin(admin_id) {
  if (!admin_id) return false;
  const p = await prisma.profile.findUnique({ where: { id: admin_id }, select: { role: true } });
  return p?.role === 'superadmin';
}

export async function getConfig() {
  const data = await prisma.eventConfig.findMany();
  const cfg = {};
  data.forEach((r) => { cfg[r.key] = r.value; });
  return cfg;
}

export async function broadcast(title, body, type) {
  try {
    const profiles = await prisma.profile.findMany({ select: { id: true } });
    if (!profiles?.length) return;
    const rows = profiles.map((p) => ({ user_id: p.id, title, body, type }));
    await prisma.notification.createMany({ data: rows });
  } catch (e) { console.error('broadcast failed:', e.message); }
}

export async function notifyUsers(userIds, title, body, type) {
  try {
    if (!userIds?.length) return;
    const rows = userIds.map((uid) => ({ user_id: uid, title, body, type }));
    await prisma.notification.createMany({ data: rows });
  } catch (e) { console.error('notify failed:', e.message); }
}

export function genTeamCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'SSXI-' + s;
}

export async function uniqueTeamCode() {
  for (let i = 0; i < 12; i++) {
    const code = genTeamCode();
    const data = await prisma.team.findUnique({ where: { code }, select: { id: true } });
    if (!data) return code;
  }
  return 'SSXI-' + Date.now().toString(36).toUpperCase().slice(-4);
}

export default { CORS, checkAdmin, checkSuperadmin, getConfig, broadcast, notifyUsers, genTeamCode, uniqueTeamCode };
