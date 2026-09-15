import { prisma } from '../config/database.js';
import { checkSuperadmin } from '../utils/helpers.js';
import { hashPassword } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { admin_id } = req.query;
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      
      const admins = await prisma.profile.findMany({
        where: { role: { in: ['admin', 'superadmin'] } },
        select: { id: true, email: true, name: true, role: true, created_at: true },
        orderBy: { created_at: 'asc' }
      });
      return res.status(200).json(admins);
    }
    
    if (req.method === 'POST') {
      const { admin_id, email, name, password } = req.body;
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
      
      const existing = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      
      const hashed = await hashPassword(password);
      const newAdmin = await prisma.profile.create({
        data: {
          id: uuidv4(),
          email: email.toLowerCase(),
          name,
          password: hashed,
          role: 'admin',
          provider: 'local',
          participant_type: 'admin'
        },
        select: { id: true, email: true, name: true, role: true, created_at: true }
      });
      return res.status(201).json(newAdmin);
    }
    
    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body;
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (id === admin_id) return res.status(400).json({ error: 'Cannot delete yourself' });
      
      const target = await prisma.profile.findUnique({ where: { id } });
      if (target?.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete superadmin' });
      
      await prisma.profile.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admins API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
