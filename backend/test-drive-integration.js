import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import { prisma } from './config/database.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const API_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log("==================================================");
  console.log("1. VERIFY ENVIRONMENT");
  console.log("==================================================");
  
  const envStatus = {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_DRIVE_REFRESH_TOKEN: !!process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID
  };
  
  for (const [key, val] of Object.entries(envStatus)) {
    console.log(`${key}: ${val ? 'PRESENT' : 'MISSING'}`);
  }
  
  if (!Object.values(envStatus).every(v => v)) {
    console.error("ENVIRONMENT VERIFICATION FAILED.");
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("3. VERIFY GOOGLE DRIVE ACCESS");
  console.log("==================================================");
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    const folder = await drive.files.get({
      fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      fields: 'id,name,capabilities,owners'
    });
    console.log(`Folder accessible: ${folder.data.name}`);
    console.log(`Can add children: ${folder.data.capabilities.canAddChildren}`);
  } catch (err) {
    console.error("Failed to access Google Drive folder:", err.message);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("PREPARE TEST DATA");
  console.log("==================================================");
  
  // Set submission round to 1 and open
  await prisma.submissionState.upsert({
    where: { id: 'global' },
    update: { currentRound: 1, isOpen: true },
    create: { id: 'global', currentRound: 1, isOpen: true }
  });
  
  // Create test user and team
  const testUserId = crypto.randomUUID();
  const testTeamId = crypto.randomUUID();
  
  await prisma.profile.create({
    data: { id: testUserId, name: 'Test User', email: `test_drive_sub_${Date.now()}@example.com`, role: 'participant' }
  });
  await prisma.team.create({
    data: { id: testTeamId, name: 'Test Team Drive', code: crypto.randomUUID().slice(0, 8), leader_id: testUserId }
  });
  await prisma.teamMember.create({
    data: { id: crypto.randomUUID(), team_id: testTeamId, user_id: testUserId }
  });
  
  // Create test admin
  const testAdminId = crypto.randomUUID();
  await prisma.profile.create({
    data: { id: testAdminId, name: 'Test Admin', email: `test_admin_${Date.now()}@example.com`, role: 'admin' }
  });
  
  const participantToken = jwt.sign({ id: testUserId, role: 'participant' }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ id: testAdminId, role: 'admin' }, process.env.JWT_SECRET);

  console.log("\n==================================================");
  console.log("4. PERFORM A REAL PARTICIPANT SUBMISSION");
  console.log("==================================================");
  
  // Create test file
  const testContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
  const fileBase64 = Buffer.from(testContent).toString('base64');
  
  const payload = {
    team_id: testTeamId,
    user_id: testUserId,
    file_name: 'SSXI-DRIVE-TEST.pdf',
    file_base64: fileBase64,
    content_type: 'application/pdf',
    github_url: 'https://github.com/test/repo'
  };
  
  const response = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${participantToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (!response.ok) {
    console.error("Submission failed:", data);
    process.exit(1);
  }
  
  const subId = data.submission.id;
  console.log(`Submission successful! App ID: ${subId}`);

  console.log("\n==================================================");
  console.log("6. VERIFY REAL DRIVE FILE ID");
  console.log("==================================================");
  
  const dbSub = await prisma.submission.findUnique({ where: { id: subId } });
  if (!dbSub.drive_file_id || dbSub.drive_file_id === 'dummy_drive_id_123') {
    console.error(`Invalid drive_file_id: ${dbSub.drive_file_id}`);
    process.exit(1);
  }
  console.log(`DB drive_file_id looks valid: ${dbSub.drive_file_id}`);

  console.log("\n==================================================");
  console.log("5. VERIFY GOOGLE DRIVE UPLOAD");
  console.log("==================================================");
  
  try {
    const driveFile = await drive.files.get({
      fileId: dbSub.drive_file_id,
      fields: 'id,name,size,mimeType'
    });
    console.log(`Verified file physically in Drive:`);
    console.log(`  Name: ${driveFile.data.name}`);
    console.log(`  Size: ${driveFile.data.size} bytes`);
    console.log(`  Mime: ${driveFile.data.mimeType}`);
  } catch(err) {
    console.error("Could not fetch file from Drive:", err.message);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("8. TEST ADMIN VIEWER");
  console.log("==================================================");
  
  const viewRes = await fetch(`${API_URL}/submissions?download_id=${subId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (viewRes.ok) {
    const buf = await viewRes.arrayBuffer();
    console.log(`Admin viewer SUCCESS: Downloaded ${buf.byteLength} bytes`);
  } else {
    const errData = await viewRes.text();
    console.error("Admin viewer FAILED:", errData);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("10. SECURITY TEST");
  console.log("==================================================");
  
  const partViewRes = await fetch(`${API_URL}/submissions?download_id=${subId}`, {
    headers: { 'Authorization': `Bearer ${participantToken}` }
  });
  console.log(`Participant access block check: Status ${partViewRes.status} (expect 403)`);
  
  const noTokenRes = await fetch(`${API_URL}/submissions?download_id=${subId}`);
  console.log(`No token block check: Status ${noTokenRes.status} (expect 401)`);
  
  console.log("\n==================================================");
  console.log("CLEANUP");
  console.log("==================================================");
  
  await drive.files.delete({ fileId: dbSub.drive_file_id }).catch(e => console.log('Clean drive fail'));
  await prisma.submission.delete({ where: { id: subId } });
  await prisma.teamMember.deleteMany({ where: { user_id: testUserId } });
  await prisma.team.delete({ where: { id: testTeamId } });
  await prisma.profile.delete({ where: { id: testUserId } });
  await prisma.profile.delete({ where: { id: testAdminId } });
  
  console.log("Tests Passed.");
}

runTests().catch(err => {
  console.error("TEST SCRIPT ERROR:", err);
  process.exit(1);
});
