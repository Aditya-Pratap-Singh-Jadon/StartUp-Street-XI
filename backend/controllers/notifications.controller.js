import { prisma } from '../config/database.js';
import { checkSuperadmin } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
      const data = await prisma.notification.findMany({ where: { user_id }, orderBy: { created_at: 'desc' }, take: 100 });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { admin_id, title, body, type } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
      
      const profiles = await prisma.profile.findMany({ select: { id: true } });
      const rows = profiles.map((p) => ({
        user_id: p.id,
        title: String(title).trim().slice(0, 200),
        body: String(body || '').slice(0, 1000),
        type: String(type || 'general').slice(0, 40),
      }));
      
      if (rows.length) {
        await prisma.notification.createMany({ data: rows });
      }
      return res.status(201).json({ ok: true, count: rows.length });
    }
    if (req.method === 'PUT') {
      const { id, read, user_id, mark_all } = req.body || {};
      if (mark_all && user_id) {
        await prisma.notification.updateMany({ where: { user_id, read: false }, data: { read: true } });
        return res.status(200).json({ ok: true });
      }
      if (!id) return res.status(400).json({ error: 'Missing id' });
      try {
        const data = await prisma.notification.update({ where: { id }, data: { read: read !== false } });
        return res.status(200).json(data);
      } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Notification not found' });
        throw err;
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('notifications API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
