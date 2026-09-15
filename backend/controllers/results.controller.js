import { prisma } from '../config/database.js';
import { checkSuperadmin, broadcast } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const POSITIONS = ['Winner', 'Runner-up', 'Recognized', 'Special Mention'];

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { all, admin_id } = req.query;
      const query = {};
      if (all === '1') {
        if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      } else {
        query.published = true;
      }
      const data = await prisma.result.findMany({ where: query, orderBy: { sort_order: 'asc' } });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { admin_id, team_name, team_code, position, category, description, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!team_name || !String(team_name).trim()) return res.status(400).json({ error: 'Team name is required' });
      if (!POSITIONS.includes(position)) return res.status(400).json({ error: 'Invalid position' });
      
      const data = await prisma.result.create({
        data: {
          team_name: String(team_name).trim().slice(0, 120),
          team_code: team_code ? String(team_code).trim().toUpperCase().slice(0, 20) : null,
          position,
          category: category ? String(category).trim().slice(0, 120) : null,
          description: description ? String(description).slice(0, 2000) : null,
          sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
          published: !!published,
        }
      });
      
      if (data.published) await broadcast('Results Published', 'Startup Street XI results are out. Check the results page.', 'results');
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { admin_id, action } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (action === 'publish_all') {
        await prisma.result.updateMany({ data: { published: true } });
        await broadcast('Results Published', 'Startup Street XI results are out. Check the results page.', 'results');
        return res.status(200).json({ ok: true });
      }
      if (action === 'unpublish_all') {
        await prisma.result.updateMany({ data: { published: false } });
        return res.status(200).json({ ok: true });
      }
      
      const { id, team_name, team_code, position, category, description, sort_order, published } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      const prev = await prisma.result.findUnique({ where: { id }, select: { published: true } });
      if (!prev) return res.status(404).json({ error: 'Result not found' });
      
      const updates = {};
      if (team_name !== undefined) updates.team_name = String(team_name).trim().slice(0, 120);
      if (team_code !== undefined) updates.team_code = team_code ? String(team_code).trim().toUpperCase().slice(0, 20) : null;
      if (position !== undefined) {
        if (!POSITIONS.includes(position)) return res.status(400).json({ error: 'Invalid position' });
        updates.position = position;
      }
      if (category !== undefined) updates.category = category ? String(category).trim().slice(0, 120) : null;
      if (description !== undefined) updates.description = description ? String(description).slice(0, 2000) : null;
      if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);
      if (published !== undefined) updates.published = !!published;
      
      const data = await prisma.result.update({ where: { id }, data: updates });
      
      if (data.published && prev && !prev.published) await broadcast('Results Published', 'Startup Street XI results are out. Check the results page.', 'results');
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.result.delete({ where: { id } }).catch(e => { if (e.code !== 'P2025') throw e; });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('results API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
