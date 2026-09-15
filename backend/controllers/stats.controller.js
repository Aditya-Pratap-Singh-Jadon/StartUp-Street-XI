import { prisma } from '../config/database.js';
import { checkAdmin, getConfig } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { admin_id } = req.query;
    if (!(await checkAdmin(admin_id))) return res.status(403).json({ error: 'Admin only' });
    const cfg = await getConfig();
    
    const [profileCount, teams, subs, members, current] = await Promise.all([
      prisma.profile.count(),
      prisma.team.findMany({ select: { id: true } }),
      prisma.submission.findMany({ select: { team_id: true, github_url: true } }),
      prisma.teamMember.findMany({ select: { team_id: true } }),
      prisma.timelineEvent.findFirst({ where: { is_current: true }, select: { title: true } }),
    ]);
    
    const sizeMap = {};
    (members || []).forEach((m) => { sizeMap[m.team_id] = (sizeMap[m.team_id] || 0) + 1; });
    
    const breakdown = {};
    Object.values(sizeMap).forEach((s) => { breakdown[String(s)] = (breakdown[String(s)] || 0) + 1; });
    
    const submittedTeams = new Set((subs || []).map((s) => String(s.team_id)));
    
    return res.status(200).json({
      participants: profileCount || 0,
      teams: (teams || []).length,
      team_size_breakdown: breakdown,
      submissions: (subs || []).length,
      github_count: (subs || []).filter((s) => s.github_url).length,
      pending: (teams || []).length - submittedTeams.size,
      current_stage: current?.title || cfg.current_stage || 'Not set',
      team_min: cfg.team_min || '3',
      team_max: cfg.team_max || '5',
      submissions_open: cfg.submissions_open || 'false',
    });
  } catch (err) {
    console.error('stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
