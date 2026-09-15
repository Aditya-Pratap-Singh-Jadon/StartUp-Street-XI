import { prisma } from '../config/database.js';
import { checkSuperadmin, broadcast, getConfig } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const cfg = await getConfig();
      return res.status(200).json(cfg);
    }
    if (req.method === 'PUT') {
      const { admin_id, values } = req.body || {};
      const isAdmin = await checkAdmin(admin_id);
      const isSuperadmin = await checkSuperadmin(admin_id);
      if (!isAdmin) return res.status(403).json({ error: 'Admin only' });
      if (!values || typeof values !== 'object') return res.status(400).json({ error: 'Missing values' });
      if (values.submissions_open !== undefined && !isSuperadmin) {
        return res.status(403).json({ error: 'Only Superadmin can toggle submissions_open' });
      }
      const prev = await getConfig();
      const allowedKeys = ['team_min', 'team_max', 'allow_leave', 'submissions_open', 'allow_resubmission', 'registration_open', 'current_stage', 'event_note', 'instagram_url', 'linkedin_url', 'contact_email', 'website_url'];
      for (const [k, v] of Object.entries(values)) {
        if (!allowedKeys.includes(k)) continue;
        let val = String(v ?? '');
        if (k === 'team_min') val = String(Math.max(1, Math.min(10, parseInt(v, 10) || 3)));
        if (k === 'team_max') val = String(Math.max(1, Math.min(10, parseInt(v, 10) || 5)));
        if (['allow_leave', 'submissions_open', 'allow_resubmission', 'registration_open'].includes(k)) val = v === true || v === 'true' ? 'true' : 'false';
        
        await prisma.eventConfig.upsert({ where: { key: k }, update: { value: val }, create: { key: k, value: val } });
      }
      if ((prev.submissions_open || 'false') !== 'true' && (values.submissions_open === true || values.submissions_open === 'true')) {
        await broadcast('Submission Open', 'The Final Review Submission page is now open. Submit your team\'s pitch deck.', 'submission');
      }
      const cfg = await getConfig();
      return res.status(200).json(cfg);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('config API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
