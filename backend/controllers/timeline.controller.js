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
      const data = await prisma.timelineEvent.findMany({ where: query, orderBy: { sort_order: 'asc' } });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { admin_id, title, description, event_time, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
      
      const maxRow = await prisma.timelineEvent.findFirst({ orderBy: { sort_order: 'desc' } });
      const nextOrder = sort_order !== undefined ? parseInt(sort_order, 10) : ((maxRow?.sort_order ?? -1) + 1);
      
      const data = await prisma.timelineEvent.create({
        data: {
          title: String(title).trim().slice(0, 160),
          description: String(description || '').slice(0, 2000),
          event_time: event_time ? new Date(event_time) : null,
          sort_order: nextOrder,
          published: published !== false,
          is_current: false,
          is_completed: false,
        }
      });
      
      if (data.published) await broadcast('Timeline Updated', `New schedule update: ${data.title}. Check the timeline.`, 'timeline');
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { admin_id, action } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      
      if (action === 'reorder') {
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
        for (let i = 0; i < order.length; i++) {
          await prisma.timelineEvent.update({ where: { id: order[i] }, data: { sort_order: i } }).catch(e => { if (e.code !== 'P2025') throw e; });
        }
        await broadcast('Timeline Updated', 'The event schedule order was updated. Check the timeline.', 'timeline');
        return res.status(200).json({ ok: true });
      }
      
      if (action === 'set_current') {
        const { id } = req.body;
        const cur = await prisma.timelineEvent.findUnique({ where: { id } });
        if (!cur) return res.status(404).json({ error: 'Event not found' });
        
        await prisma.timelineEvent.updateMany({ data: { is_current: false } });
        await prisma.timelineEvent.update({ where: { id }, data: { is_current: true } });
        
        const allEvents = await prisma.timelineEvent.findMany({ orderBy: { sort_order: 'asc' } });
        for (const e of allEvents) {
          await prisma.timelineEvent.update({ where: { id: e.id }, data: { is_completed: e.sort_order < cur.sort_order } });
        }
        
        await prisma.eventConfig.upsert({ where: { key: 'current_stage' }, update: { value: cur.title }, create: { key: 'current_stage', value: cur.title } });
        await broadcast('Timeline Updated', `Current stage: ${cur.title}.`, 'timeline');
        return res.status(200).json({ ok: true });
      }
      
      const { id, title, description, event_time, published, is_completed } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      const updates = {};
      if (title !== undefined) updates.title = String(title).trim().slice(0, 160);
      if (description !== undefined) updates.description = String(description).slice(0, 2000);
      if (event_time !== undefined) updates.event_time = event_time ? new Date(event_time) : null;
      if (published !== undefined) updates.published = !!published;
      if (is_completed !== undefined) updates.is_completed = !!is_completed;
      
      try {
        const data = await prisma.timelineEvent.update({ where: { id }, data: updates });
        await broadcast('Timeline Updated', `Schedule update: ${data.title}. Check the timeline.`, 'timeline');
        return res.status(200).json(data);
      } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
        throw err;
      }
    }
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.timelineEvent.delete({ where: { id } }).catch(e => { if (e.code !== 'P2025') throw e; });
      await broadcast('Timeline Updated', 'The event schedule was updated. Check the timeline.', 'timeline');
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('timeline API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
