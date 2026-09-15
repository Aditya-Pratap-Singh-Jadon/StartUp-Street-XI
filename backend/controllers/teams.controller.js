import { prisma } from '../config/database.js';
import { checkAdmin, getConfig, uniqueTeamCode, notifyUsers } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function membersOf(team_id) {
  const members = await prisma.teamMember.findMany({ where: { team_id }, orderBy: { joined_at: 'asc' } });
  if (!members.length) return [];
  const profiles = await prisma.profile.findMany({ where: { id: { in: members.map((m) => m.user_id) } } });
  
  const pmap = {};
  profiles.forEach((p) => { pmap[p.id] = p; });
  
  return members.map((m) => ({ ...m, profile: pmap[m.user_id] || null }));
}

async function userTeam(user_id) {
  const mem = await prisma.teamMember.findUnique({ where: { user_id } });
  if (!mem) return null;
  const team = await prisma.team.findUnique({ where: { id: mem.team_id } });
  if (!team) return null;
  const members = await membersOf(team.id);
  return { ...team, members };
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { code, user_id, all, admin_id } = req.query;
      if (all === '1') {
        if (!(await checkAdmin(admin_id))) return res.status(403).json({ error: 'Admin only' });
        const teams = await prisma.team.findMany({ orderBy: { created_at: 'desc' } });
        const out = [];
        for (const t of teams) {
          const members = await membersOf(t.id);
          const sub = await prisma.submission.findUnique({ 
            where: { team_id: t.id }, 
            select: { id: true, file_name: true, github_url: true, created_at: true, status: true } 
          });
          out.push({ ...t, members, member_count: members.length, submission: sub || null });
        }
        return res.status(200).json(out);
      }
      if (code) {
        const clean = String(code).trim().toUpperCase();
        const team = await prisma.team.findUnique({ where: { code: clean } });
        if (!team) return res.status(404).json({ error: 'Team not found. Check the Team Code and try again.' });
        const members = await membersOf(team.id);
        const cfg = await getConfig();
        const max = parseInt(cfg.team_max || '5', 10);
        return res.status(200).json({ ...team, members, member_count: members.length, team_max: max });
      }
      if (user_id) {
        const t = await userTeam(user_id);
        return res.status(200).json(t);
      }
      return res.status(400).json({ error: 'Missing query: code, user_id or all' });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};
      const cfg = await getConfig();
      const teamMax = parseInt(cfg.team_max || '5', 10);
      const teamMin = parseInt(cfg.team_min || '3', 10);

      if (action === 'create') {
        const { name, user_id } = req.body;
        if (!name || !user_id) return res.status(400).json({ error: 'Team name and user are required' });
        const cleanName = String(name).trim().slice(0, 60);
        if (cleanName.length < 2) return res.status(400).json({ error: 'Team name must be at least 2 characters' });
        const existing = await userTeam(user_id);
        if (existing) return res.status(400).json({ error: 'You are already in a team. Leave it before creating a new one.' });
        
        const dup = await prisma.team.findFirst({ where: { name: { equals: cleanName, mode: 'insensitive' } } });
        if (dup) return res.status(400).json({ error: 'A team with this name already exists' });
        
        const code = await uniqueTeamCode();
        const team = await prisma.team.create({ data: { name: cleanName, code, leader_id: user_id } });
        
        try {
          await prisma.teamMember.create({ data: { team_id: team.id, user_id } });
        } catch (mErr) {
          await prisma.team.delete({ where: { id: team.id } });
          if (mErr.code === 'P2002') return res.status(400).json({ error: 'You are already in a team.' });
          throw mErr;
        }
        const members = await membersOf(team.id);
        return res.status(201).json({ ...team, members, team_min: teamMin, team_max: teamMax });
      }

      if (action === 'join') {
        const { code, user_id } = req.body;
        if (!code || !user_id) return res.status(400).json({ error: 'Team code and user are required' });
        const clean = String(code).trim().toUpperCase();
        const team = await prisma.team.findUnique({ where: { code: clean } });
        if (!team) return res.status(404).json({ error: 'Team not found. Check the Team Code and try again.' });
        const already = await userTeam(user_id);
        if (already) {
          if (already.id === team.id) return res.status(400).json({ error: 'You are already a member of this team' });
          return res.status(400).json({ error: 'You are already in another team. Leave it before joining a new one.' });
        }
        const members = await membersOf(team.id);
        if (members.length >= teamMax) return res.status(400).json({ error: `This team is full (maximum ${teamMax} members)` });
        
        try {
          await prisma.teamMember.create({ data: { team_id: team.id, user_id } });
        } catch (err) {
          if (err.code === 'P2002') return res.status(400).json({ error: 'You are already in a team.' });
          throw err;
        }
        await notifyUsers(members.map(m => m.user_id), 'New member joined', `A new member joined your team ${team.name} (${team.code}).`, 'team');
        await notifyUsers([user_id], 'Congratulations!', `You joined the team: "${team.name}"`, 'team');
        const updated = await membersOf(team.id);
        return res.status(200).json({ ...team, members: updated });
      }

      if (action === 'leave') {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ error: 'Missing user' });
        if ((cfg.allow_leave || 'true') !== 'true') return res.status(403).json({ error: 'Leaving teams is currently disabled by the organizers' });
        const t = await userTeam(user_id);
        if (!t) return res.status(400).json({ error: 'You are not in a team' });
        const others = t.members.filter((m) => m.user_id !== user_id);
        
        if (others.length === 0) {
          await prisma.submission.deleteMany({ where: { team_id: t.id } });
          await prisma.teamMember.deleteMany({ where: { team_id: t.id } });
          await prisma.team.delete({ where: { id: t.id } });
          return res.status(200).json({ ok: true, disbanded: true });
        }
        if (t.leader_id === user_id) {
          // Find the earliest joined remaining member
          const next = others.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())[0];
          if (next && next.user_id) {
            await prisma.team.update({ where: { id: t.id }, data: { leader_id: next.user_id } });
            await notifyUsers([next.user_id], 'You are now team leader', `You are now the leader of ${t.name} (${t.code}).`, 'team');
          }
        }
        await prisma.teamMember.delete({ where: { user_id } });
        return res.status(200).json({ ok: true });
      }

      if (action === 'remove_member') {
        const { team_id, user_id, target_id } = req.body;
        if (!team_id || !user_id || !target_id) return res.status(400).json({ error: 'Missing fields' });
        const team = await prisma.team.findUnique({ where: { id: team_id } });
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.leader_id !== user_id) return res.status(403).json({ error: 'Only the team leader can remove members' });
        if (target_id === user_id) return res.status(400).json({ error: 'Leader cannot remove themselves. Leave the team instead.' });
        
        await prisma.teamMember.delete({ where: { user_id: target_id } });
        return res.status(200).json({ ok: true });
      }

      if (action === 'rename') {
        const { team_id, user_id, name } = req.body;
        if (!team_id || !name) return res.status(400).json({ error: 'Missing team_id or name' });
        const cfg = await getConfig();
        if ((cfg.registration_open || 'false') !== 'true') return res.status(403).json({ error: 'Registration is closed' });
        
        const team = await prisma.team.findUnique({ where: { id: team_id } });
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.leader_id !== user_id && !(await checkAdmin(user_id))) return res.status(403).json({ error: 'Only leader or admin can rename' });
        
        const updated = await prisma.team.update({ where: { id: team_id }, data: { name: String(name).trim().slice(0, 60) } });
        return res.status(200).json(updated);
      }
      
      if (action === 'toggle_jury_selection') {
        const { admin_id, team_id, is_selected_for_jury } = req.body;
        if (!(await checkAdmin(admin_id))) return res.status(403).json({ error: 'Admin only' });
        if (!team_id) return res.status(400).json({ error: 'Missing team_id' });
        const updated = await prisma.team.update({
          where: { id: team_id },
          data: { is_selected_for_jury: !!is_selected_for_jury }
        });
        return res.status(200).json(updated);
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'PUT') {
      const { team_id, user_id, name } = req.body || {};
      if (!team_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
      const team = await prisma.team.findUnique({ where: { id: team_id } });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (team.leader_id !== user_id) return res.status(403).json({ error: 'Only the team leader can rename the team' });
      const cleanName = String(name || '').trim().slice(0, 60);
      if (cleanName.length < 2) return res.status(400).json({ error: 'Team name must be at least 2 characters' });
      
      const data = await prisma.team.update({ where: { id: team_id }, data: { name: cleanName } });
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('teams API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
