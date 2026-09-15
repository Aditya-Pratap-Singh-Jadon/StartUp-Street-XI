import { prisma } from '../config/database.js';
import { checkSuperadmin, broadcast } from '../utils/helpers.js';

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
      const { all } = req.query;
      const query = all === '1' ? {} : { published: true };
      const data = await prisma.announcement.findMany({ where: query, orderBy: { created_at: 'desc' } });
      const now = new Date();
      const list = data.filter((a) => all === '1' || !a.expires_at || a.expires_at > now);
      return res.status(200).json(list);
    }
    if (req.method === 'POST') {
      const { admin_id, title, content, priority, published, expires_at } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
      if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required' });
      const allowed = ['normal', 'important', 'urgent'];
      
      const data = await prisma.announcement.create({
        data: {
          title: String(title).trim().slice(0, 200),
          content: String(content).slice(0, 5000),
          priority: allowed.includes(priority) ? priority : 'normal',
          published: published !== false,
          expires_at: expires_at ? new Date(expires_at) : null,
        }
      });
      
      if (data.published) await broadcast('New Announcement', data.title, 'announcement');
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { admin_id, id, title, content, priority, published, expires_at } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      const prev = await prisma.announcement.findUnique({ where: { id }, select: { published: true } });
      if (!prev) return res.status(404).json({ error: 'Announcement not found' });

      const updates = {};
      if (title !== undefined) updates.title = String(title).trim().slice(0, 200);
      if (content !== undefined) updates.content = String(content).slice(0, 5000);
      if (priority !== undefined && ['normal', 'important', 'urgent'].includes(priority)) updates.priority = priority;
      if (published !== undefined) updates.published = !!published;
      if (expires_at !== undefined) updates.expires_at = expires_at ? new Date(expires_at) : null;
      
      const data = await prisma.announcement.update({ where: { id }, data: updates });
      
      if (data.published && prev && !prev.published) await broadcast('New Announcement', data.title, 'announcement');
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.announcement.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('announcements API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
