import { prisma } from '../config/database.js';
import { checkAdmin, checkSuperadmin, getConfig, notifyUsers } from '../utils/helpers.js';
import { uploadToDrive, getDriveFileStream } from '../utils/drive.js';
import { verifyToken } from '../utils/auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ALLOWED_EXT = ['ppt', 'pptx', 'doc', 'docx', 'pdf'];
const MAX_BYTES = 15 * 1024 * 1024;
const GITHUB_RE = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?(\s*)?$/;
const URL_RE = /^https?:\/\/.+/;

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  try {
    const path = req.path || '/';

    // EVERYONE: Get global submission state
    if (path === '/state' && req.method === 'GET') {
      let state = await prisma.submissionState.findUnique({ where: { id: 'global' } });
      if (!state) {
        state = { currentRound: 0, isOpen: true, startedAt: null, endedAt: null };
      }
      return res.status(200).json({
        currentRound: state.currentRound,
        isOpen: state.isOpen,
        startedAt: state.startedAt,
        endedAt: state.endedAt
      });
    }

    // SUPERADMIN: Start submission round
    if (path === '/state/start' && req.method === 'POST') {
      const { admin_id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Only Superadmin can control the submission window.' });
      
      let state = await prisma.submissionState.findUnique({ where: { id: 'global' } });
      if (!state) state = { currentRound: 0, isOpen: true };

      if (state.currentRound === 1 && state.isOpen) return res.status(400).json({ error: 'Round 1 is already active.' });
      if (state.currentRound === 2 && state.isOpen) return res.status(400).json({ error: 'Round 2 is already active.' });
      if (state.currentRound === 2 && !state.isOpen) return res.status(400).json({ error: 'Round 2 has already ended.' });
      
      let nextRound = 1;
      if (state.currentRound === 1 && !state.isOpen) {
        nextRound = 2;
      } else if (state.currentRound !== 0) {
        return res.status(400).json({ error: 'Invalid state transition.' });
      }

      const updated = await prisma.submissionState.upsert({
        where: { id: 'global' },
        update: { currentRound: nextRound, isOpen: true, startedAt: new Date(), endedAt: null, updatedBy: admin_id },
        create: { id: 'global', currentRound: nextRound, isOpen: true, startedAt: new Date(), endedAt: null, updatedBy: admin_id }
      });
      return res.status(200).json(updated);
    }

    // SUPERADMIN: End submission round
    if (path === '/state/end' && req.method === 'POST') {
      const { admin_id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Only Superadmin can control the submission window.' });
      
      let state = await prisma.submissionState.findUnique({ where: { id: 'global' } });
      if (!state || (state.currentRound === 0 && state.isOpen)) return res.status(400).json({ error: 'Submission rounds have not started.' });
      
      if (state.currentRound === 1 && !state.isOpen) return res.status(400).json({ error: 'Round 1 has already ended.' });
      if (state.currentRound === 2 && !state.isOpen) return res.status(400).json({ error: 'Round 2 has already ended.' });

      const updated = await prisma.submissionState.upsert({
        where: { id: 'global' },
        update: { isOpen: false, endedAt: new Date(), updatedBy: admin_id },
        create: { id: 'global', currentRound: state.currentRound, isOpen: false, endedAt: new Date(), updatedBy: admin_id }
      });
      return res.status(200).json(updated);
    }

    // SUPERADMIN: Reset submission round
    if (path === '/state/reset' && req.method === 'POST') {
      const { admin_id } = req.body || {};
      if (!(await checkSuperadmin(admin_id))) return res.status(403).json({ error: 'Only Superadmin can control the submission window.' });
      
      const updated = await prisma.submissionState.upsert({
        where: { id: 'global' },
        update: { currentRound: 0, isOpen: false, startedAt: null, endedAt: null, updatedBy: admin_id },
        create: { id: 'global', currentRound: 0, isOpen: false, startedAt: null, endedAt: null, updatedBy: admin_id }
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'GET' && path === '/my') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
      
      const mem = await prisma.teamMember.findUnique({ where: { user_id } });
      if (!mem) return res.status(404).json({ error: 'User not in a team' });
      
      const state = await prisma.submissionState.findUnique({ where: { id: 'global' } });
      if (!state) return res.status(200).json({ success: true, currentRound: 0, submission: null });
      
      if (state.currentRound === 0) {
        return res.status(200).json({ success: true, currentRound: 0, submission: null });
      }
      
      const sub = await prisma.submission.findUnique({ 
        where: { team_id_round: { team_id: mem.team_id, round: state.currentRound } } 
      });
      
      return res.status(200).json({
        success: true,
        currentRound: state.currentRound,
        submission: sub ? {
          round: sub.round,
          status: sub.status,
          githubUrl: sub.github_url,
          deployedUrl: sub.deployed_url,
          fileName: sub.file_name,
          submittedAt: sub.updated_at || sub.created_at
        } : null
      });
    }

    if (req.method === 'GET' && path === '/') {
      const { team_id, all, admin_id, download_id } = req.query;
      
      // DOWNLOAD PROXY
      if (download_id) {
        let token = req.query.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
        
        const decoded = verifyToken(token);
        if (!decoded || !decoded.id) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        
        if (!(await checkAdmin(decoded.id))) return res.status(403).json({ error: 'Admin only' });
        
        const file = await prisma.submission.findUnique({ where: { id: String(download_id) } });
        if (!file) return res.status(404).json({ error: 'File not found' });
        
        res.setHeader('Content-Type', file.file_content_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.file_name || 'submission'}"`);
        
        // Backward compatibility for legacy files
        if (file.file_data) {
          return res.status(200).send(Buffer.from(file.file_data));
        } else if (file.drive_file_id) {
          try {
            const stream = await getDriveFileStream(file.drive_file_id);
            return stream.pipe(res);
          } catch (err) {
            console.error('Drive fetch error:', err);
            return res.status(500).json({ error: 'Failed to retrieve file from Drive' });
          }
        } else {
          return res.status(404).json({ error: 'No file data found for this submission' });
        }
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
      const data = await prisma.submission.findMany({ where: { team_id }, orderBy: { round: 'asc' }, select: {
        id: true, team_id: true, round: true, file_name: true, file_url: true, file_type: true, file_size: true, github_url: true, deployed_url: true, status: true, submitted_by: true, updated_at: true, created_at: true
      }});
      return res.status(200).json(data);
    }

    if ((req.method === 'POST' || req.method === 'PUT') && path === '/') {
      const { team_id, user_id, file_name, file_base64, content_type, github_url, deployed_url } = req.body || {};
      
      const state = await prisma.submissionState.findUnique({ where: { id: 'global' } });
      if (!state || state.currentRound === 0) return res.status(403).json({ error: 'Submission rounds have not started yet.' });
      if (!state.isOpen) return res.status(403).json({ error: `Round ${state.currentRound} submission window has ended.` });
      
      const round = state.currentRound;

      if (!team_id || !user_id) return res.status(400).json({ error: 'Missing team or user' });
      
      const mem = await prisma.teamMember.findUnique({ where: { user_id } });
      if (!mem || mem.team_id !== team_id) return res.status(403).json({ error: 'Only team members can submit for this team' });
      
      let gh = github_url ? String(github_url).trim() : null;
      if (gh === '') gh = null;
      if (gh && !GITHUB_RE.test(gh)) return res.status(400).json({ error: 'GitHub URL must look like https://github.com/owner/repo' });
      
      let dep = deployed_url ? String(deployed_url).trim() : null;
      if (dep === '') dep = null;
      if (dep && !URL_RE.test(dep)) return res.status(400).json({ error: 'Deployed Website URL must be a valid http/https URL' });
      
      const prev = await prisma.submission.findUnique({ where: { team_id_round: { team_id, round } } });
      const hasPrev = !!prev;
      
      const cfg = await getConfig();
      if (hasPrev && (cfg.allow_resubmission || 'true') !== 'true') {
        return res.status(400).json({ error: 'Your team has already submitted for this round. Resubmission is disabled.' });
      }
      
      // Update URLs only if no new file is provided during a resubmission
      if ((!file_name || !file_base64) && hasPrev) {
        if (!gh && !dep && prev.github_url && prev.deployed_url) {
          return res.status(400).json({ error: 'Choose a presentation file to resubmit, or update the URLs.' });
        }
        const data = await prisma.submission.update({
          where: { id: prev.id },
          data: { github_url: gh, deployed_url: dep, updated_at: new Date() }
        });
        return res.status(200).json(data);
      }
      
      if (!file_name || !file_base64) return res.status(400).json({ error: 'Presentation file is required' });
      const ext = String(file_name).split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) return res.status(400).json({ error: 'Only PPT, PPTX, DOC, DOCX, or PDF files are allowed' });
      const approxBytes = Math.floor(String(file_base64).length * 0.75);
      if (approxBytes > MAX_BYTES) return res.status(400).json({ error: 'File must be under 15 MB' });

      const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      const buffer = Buffer.from(String(file_base64), 'base64');
      
      let drive_file_id = null;
      try {
        const driveFileName = `[Team ${team_id}] [Round ${round}] ${safeName}`;
        drive_file_id = await uploadToDrive(buffer, content_type || 'application/octet-stream', driveFileName);
      } catch (err) {
        console.error('Drive upload error:', err.message);
        return res.status(502).json({ error: 'File upload to storage failed. Please try again. If this persists, contact the event organizer.' });
      }
      
      const row = {
        team_id,
        round,
        file_name: String(file_name).slice(0, 160),
        file_type: ext,
        file_size: approxBytes,
        drive_file_id,
        file_content_type: content_type || 'application/octet-stream',
        github_url: gh,
        deployed_url: dep,
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
      
      // Remove file_data from response if it accidentally leaked
      saved.file_data = undefined;
      return res.status(req.method === 'POST' ? 201 : 200).json({
        success: true,
        submission: saved
      });
    }

    if (req.method === 'DELETE' && path === '/') {
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
