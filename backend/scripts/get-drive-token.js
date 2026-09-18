/**
 * ONE-TIME SETUP SCRIPT — Get Google Drive OAuth Refresh Token
 *
 * Run this ONCE on your local machine to obtain a refresh token for your
 * personal Google account. The refresh token is then stored as a backend
 * environment variable (GOOGLE_DRIVE_REFRESH_TOKEN) on both local .env
 * and on Render. It is NEVER exposed to the frontend.
 *
 * Prerequisites in Google Cloud Console:
 * 1. Go to: https://console.cloud.google.com/
 * 2. Select your project (the one with client ID ending in .apps.googleusercontent.com)
 * 3. Go to APIs & Services → Credentials
 * 4. Click your OAuth 2.0 Client ID
 * 5. Under "Authorized redirect URIs", add: http://localhost:3001/oauth2callback
 * 6. Go to APIs & Services → Library → search "Google Drive API" → Enable it
 * 7. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env (backend only)
 *
 * Usage:
 *   node scripts/get-drive-token.js
 *
 * Then open the URL shown in your browser, authorize with YOUR Google account
 * (the one that owns SSXI-Submissions folder), and the refresh token will
 * be printed. Add it to your .env as GOOGLE_DRIVE_REFRESH_TOKEN.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\nERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in backend/.env');
  console.error('\nSteps:');
  console.error('1. Go to https://console.cloud.google.com/apis/credentials');
  console.error('2. Open your OAuth 2.0 Client ID (Web application type)');
  console.error('3. Add http://localhost:3001/oauth2callback to "Authorized redirect URIs"');
  console.error('4. Copy the Client ID and Client Secret');
  console.error('5. Add to backend/.env:');
  console.error('   GOOGLE_CLIENT_ID=your_client_id_here');
  console.error('   GOOGLE_CLIENT_SECRET=your_client_secret_here');
  console.error('6. Run this script again: node scripts/get-drive-token.js');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent', // Force consent screen to ensure refresh_token is always returned
});

console.log('\n========================================');
console.log(' SSXI Google Drive OAuth Setup');
console.log('========================================');
console.log('\n1. Open this URL in your browser (use the Google account that owns SSXI-Submissions):');
console.log('\n   ' + authUrl + '\n');
console.log('2. Grant access when prompted.');
console.log('3. You will be redirected to localhost:3001 — this script will capture the token.\n');

// Start a local server to capture the OAuth callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/oauth2callback') {
    const code = parsedUrl.query.code;
    if (!code) {
      res.writeHead(400);
      res.end('No authorization code received. Please try again.');
      server.close();
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h2>Success! Return to your terminal for the refresh token.</h2></body></html>');
      server.close();

      console.log('\n========================================');
      console.log(' TOKEN OBTAINED SUCCESSFULLY');
      console.log('========================================');
      if (tokens.refresh_token) {
        console.log('\nAdd this to your backend/.env file:');
        console.log('GOOGLE_DRIVE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('\nAlso add this SAME value to Render environment variables as:');
        console.log('GOOGLE_DRIVE_REFRESH_TOKEN=<same value>');
        console.log('\nDO NOT share this token. DO NOT commit it to Git.');
      } else {
        console.log('\nWARNING: No refresh_token in response.');
        console.log('This usually means you already authorized this app previously.');
        console.log('Go to https://myaccount.google.com/permissions, revoke SSXI access, then re-run this script.');
      }
      console.log('========================================\n');
    } catch (err) {
      res.writeHead(500);
      res.end('Error obtaining token: ' + err.message);
      server.close();
      console.error('\nERROR obtaining token:', err.message);
    }
  }
});

server.listen(3001, () => {
  console.log('Waiting for OAuth callback on http://localhost:3001/oauth2callback ...');
});
