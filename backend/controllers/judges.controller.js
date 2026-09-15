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
      const { all } = req.query;
      const query = all === '1' ? {} : { published: true };
      const data = await prisma.judge.findMany({ where: query, orderBy: { sort_order: 'asc' } });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { admin_id, name, designation, organization, description, photo_url, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
      
      const data = await prisma.judge.create({
        data: {
          name: String(name).trim().slice(0, 120),
          designation: designation ? String(designation).trim().slice(0, 160) : null,
          organization: organization ? String(organization).trim().slice(0, 160) : null,
          description: description ? String(description).slice(0, 2000) : null,
          photo_url: photo_url ? String(photo_url).trim().slice(0, 500) : null,
          sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
          published: published !== false,
        }
      });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { admin_id, id, name, designation, organization, description, photo_url, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = {};
      if (name !== undefined) updates.name = String(name).trim().slice(0, 120);
      if (designation !== undefined) updates.designation = designation ? String(designation).trim().slice(0, 160) : null;
      if (organization !== undefined) updates.organization = organization ? String(organization).trim().slice(0, 160) : null;
      if (description !== undefined) updates.description = description ? String(description).slice(0, 2000) : null;
      if (photo_url !== undefined) updates.photo_url = photo_url ? String(photo_url).trim().slice(0, 500) : null;
      if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);
      if (published !== undefined) updates.published = !!published;
      
      try {
        const data = await prisma.judge.update({ where: { id }, data: updates });
        return res.status(200).json(data);
      } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Judge not found' });
        throw err;
      }
    }
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.judge.delete({ where: { id } }).catch(e => { if (e.code !== 'P2025') throw e; });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('judges API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
