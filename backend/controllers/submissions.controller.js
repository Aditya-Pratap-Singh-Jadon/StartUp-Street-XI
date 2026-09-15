import { prisma } from '../config/database.js';
import { checkAdmin, checkSuperadmin, getConfig, notifyUsers } from '../utils/helpers.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ALLOWED_EXT = ['ppt', 'pptx', 'doc', 'docx'];
const MAX_BYTES = 15 * 1024 * 1024;
const GITHUB_RE = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?(\s*)?$/;

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { team_id, all, admin_id, download_id } = req.query;
      
      if (download_id) {
        const file = await prisma.submission.findUnique({ where: { id: String(download_id) } });
        if (!file?.file_data) return res.status(404).json({ error: 'File not found' });
        res.setHeader('Content-Type', file.file_content_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.file_name || 'submission'}"`);
        return res.status(200).send(Buffer.from(file.file_data));
      }

      if (all === '1') {
        if (!(await checkAdmin(admin_id))) return res.status(403).json({ error: 'Admin only' });
        const subs = await prisma.submission.findMany({ orderBy: { created_at: 'desc' } });
        const out = [];
        for (const s of subs) {
          const team = await prisma.team.findUnique({ where: { id: s.team_id } });
          let members = [];
          if (team) {
            const mems = await prisma.teamMember.findMany({ where: { team_id: team.id }, select: { user_id: true, joined_at: true } });
            members = mems || [];
            if (members.length) {
              const profs = await prisma.profile.findMany({ where: { id: { in: members.map((m) => m.user_id) } }, select: { id: true, email: true, name: true } });
              const pm = {};
              (profs || []).forEach((p) => { pm[p.id] = p; });
              members = members.map((m) => ({ ...m, profile: pm[m.user_id] || null }));
            }
          }
          out.push({ ...s, team: team || null, members });
        }
        return res.status(200).json(out);
      }
      if (!team_id) return res.status(400).json({ error: 'Missing team_id' });
      const data = await prisma.submission.findMany({ where: { team_id }, orderBy: { round: 'asc' } });
      return res.status(200).json(data);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { team_id, user_id, file_name, file_base64, content_type, github_url, round: rawRound } = req.body || {};
      const round = parseInt(rawRound || '1', 10);
      if (!team_id || !user_id) return res.status(400).json({ error: 'Missing team or user' });
      const cfg = await getConfig();
      if ((cfg.submissions_open || 'false') !== 'true') return res.status(403).json({ error: 'Submissions are currently closed' });
      
      const mem = await prisma.teamMember.findUnique({ where: { user_id } });
      if (!mem || mem.team_id !== team_id) return res.status(403).json({ error: 'Only team members can submit for this team' });
      
      let gh = github_url ? String(github_url).trim() : null;
      if (gh === '') gh = null;
      if (gh && !GITHUB_RE.test(gh)) return res.status(400).json({ error: 'GitHub URL must look like https://github.com/owner/repo' });
      
      const prev = await prisma.submission.findUnique({ where: { team_id_round: { team_id, round } } });
      const hasPrev = !!prev;
      if (hasPrev && (cfg.allow_resubmission || 'true') !== 'true') {
        return res.status(400).json({ error: 'Your team has already submitted for this round. Resubmission is disabled.' });
      }
      
      if ((!file_name || !file_base64) && hasPrev) {
        if (!gh && prev.github_url) {
          return res.status(400).json({ error: 'Choose a presentation file to resubmit, or update the GitHub URL.' });
        }
        const data = await prisma.submission.update({
          where: { id: prev.id },
          data: { github_url: gh, updated_at: new Date() }
        });
        return res.status(200).json(data);
      }
      
      if (!file_name || !file_base64) return res.status(400).json({ error: 'Presentation file is required' });
      const ext = String(file_name).split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) return res.status(400).json({ error: 'Only PPT, PPTX, DOC or DOCX files are allowed' });
      const approxBytes = Math.floor(String(file_base64).length * 0.75);
      if (approxBytes > MAX_BYTES) return res.status(400).json({ error: 'File must be under 15 MB' });

      const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      const buffer = Buffer.from(String(file_base64), 'base64');
      
      const row = {
        team_id,
        round,
        file_name: String(file_name).slice(0, 160),
        file_type: ext,
        file_size: approxBytes,
        file_data: buffer,
        file_content_type: content_type || 'application/octet-stream',
        github_url: gh,
        status: 'submitted',
        submitted_by: user_id,
        updated_at: new Date(),
      };
      
      let saved;
      if (hasPrev) {
        saved = await prisma.submission.update({ where: { id: prev.id }, data: row });
      } else {
        saved = await prisma.submission.create({ data: row });
      }
      const reqProto = req.headers['x-forwarded-proto'] || 'http';
      const reqHost = req.headers.host;
      saved = await prisma.submission.update({
        where: { id: saved.id },
        data: { file_url: `${reqProto}://${reqHost}/api/submissions?download_id=${saved.id}` }
      });
      
      const teamMems = await prisma.teamMember.findMany({ where: { team_id }, select: { user_id: true } });
      await notifyUsers((teamMems || []).map((m) => m.user_id), 'Submission received', `Your team's Round ${round} submission was saved successfully.`, 'submission');
      
      return res.status(req.method === 'POST' ? 201 : 200).json(saved);
    }

    if (req.method === 'DELETE') {
      const { admin_id, id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Superadmin only' });
      if (!id) return res.status(400).json({ error: 'Missing id' });
      
      await prisma.submission.delete({ where: { id } }).catch(e => { if (e.code !== 'P2025') throw e; });
      
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('submissions API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
