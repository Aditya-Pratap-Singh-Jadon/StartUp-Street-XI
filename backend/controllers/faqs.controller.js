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
      const data = await prisma.fAQ.findMany({ where: query, orderBy: { sort_order: 'asc' } });
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { admin_id, question, answer, category, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!question || !String(question).trim()) return res.status(400).json({ error: 'Question is required' });
      if (!answer || !String(answer).trim()) return res.status(400).json({ error: 'Answer is required' });
      
      const data = await prisma.fAQ.create({
        data: {
          question: String(question).trim().slice(0, 300),
          answer: String(answer).slice(0, 3000),
          category: category ? String(category).trim().slice(0, 80) : 'General',
          sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
          published: published !== false,
        }
      });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { admin_id, id, question, answer, category, sort_order, published } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = {};
      if (question !== undefined) updates.question = String(question).trim().slice(0, 300);
      if (answer !== undefined) updates.answer = String(answer).slice(0, 3000);
      if (category !== undefined) updates.category = String(category).trim().slice(0, 80);
      if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);
      if (published !== undefined) updates.published = !!published;
      
      try {
        const data = await prisma.fAQ.update({ where: { id }, data: updates });
        return res.status(200).json(data);
      } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'FAQ not found' });
        throw err;
      }
    }
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.fAQ.delete({ where: { id } }).catch(e => {
        if (e.code !== 'P2025') throw e;
      });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('faqs API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
