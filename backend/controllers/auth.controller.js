import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { sendOTP } from '../utils/email.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// If GOOGLE_CLIENT_ID is not set, Google login will fail gracefully
const googleClient = process.env.VITE_GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID) : null;

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
      const p = await prisma.profile.findUnique({ where: { id: user_id } });
      if (!p) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json(p);
    }
    
    if (req.method === 'POST') {
      const { action } = req.body || {};
      
      if (action === 'register') {
        const { email, participant_type } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        
        if (participant_type === 'vit_student' && !email.endsWith('@vitstudent.ac.in')) {
          return res.status(400).json({ error: 'VIT Students must use their @vitstudent.ac.in email address.' });
        }
        
        const existing = await prisma.profile.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'User with this email already exists' });
        
        // Generate 6 digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save to DB
        await prisma.oTP.deleteMany({ where: { email } }); // Delete any existing OTP
        await prisma.oTP.create({ data: { email, otp: otpCode } });
        
        // Send email
        const sent = await sendOTP(email, otpCode);
        if (!sent) return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
        
        return res.status(200).json({ message: 'OTP sent successfully' });
      }

      if (action === 'verify-otp') {
        const { email, otp, password, name, phone, reg_no, participant_type } = req.body;
        if (!email || !otp || !password) return res.status(400).json({ error: 'Missing required fields' });
        
        const record = await prisma.oTP.findFirst({ where: { email, otp } });
        if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });
        
        // Delete OTP so it can't be reused
        await prisma.oTP.delete({ where: { id: record.id } });
        
        const existing = await prisma.profile.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'User already exists' });
        
        const hashed = await hashPassword(password);
        const user_id = uuidv4();
        
        const p = await prisma.profile.create({
          data: {
            id: user_id,
            email,
            password: hashed,
            provider: 'local',
            name: name || '',
            phone: phone || '',
            reg_no: participant_type === 'vit_student' ? (reg_no || '') : '',
            role: 'participant',
            participant_type: participant_type || 'external'
          }
        });
        
        const token = generateToken({ id: p.id, role: p.role, email: p.email });
        return res.status(201).json({ token, user: p });
      }
      
      if (action === 'login') {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        
        const p = await prisma.profile.findUnique({ where: { email } });
        if (!p) return res.status(400).json({ error: 'Invalid credentials' });
        if (p.provider === 'google') return res.status(400).json({ error: 'This email is associated with a Google account. Please use Google Login.' });
        
        const isValid = await comparePassword(password, p.password);
        if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = generateToken({ id: p.id, role: p.role, email: p.email });
        return res.status(200).json({ token, user: p });
      }
      
      if (action === 'google') {
        const { credential, participant_type } = req.body;
        if (!credential) return res.status(400).json({ error: 'Google credential is required' });
        if (!googleClient) return res.status(500).json({ error: 'Google Login is not configured on the server' });
        
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.VITE_GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload;
        
        if (participant_type === 'vit_student' && !email.endsWith('@vitstudent.ac.in')) {
          return res.status(403).json({ error: 'VIT Students must use their @vitstudent.ac.in email address.' });
        }
        
        let p = await prisma.profile.findUnique({ where: { email } });
        if (!p) {
          p = await prisma.profile.create({
            data: {
              id: uuidv4(),
              email,
              provider: 'google',
              name: name || '',
              role: 'participant',
              participant_type: participant_type || 'external'
            }
          });
        }
        
        const token = generateToken({ id: p.id, role: p.role, email: p.email });
        return res.status(200).json({ token, user: p });
      }
      
      return res.status(400).json({ error: 'Unknown action' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('auth API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
