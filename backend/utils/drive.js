/**
 * Google Drive utility — uses OAuth2 with a refresh token from your personal
 * Google account. This allows uploading to a regular My Drive folder without
 * needing a Shared Drive or service account delegation.
 *
 * Required backend environment variables:
 *   GOOGLE_CLIENT_ID        - OAuth 2.0 client ID (Web application)
 *   GOOGLE_CLIENT_SECRET    - OAuth 2.0 client secret
 *   GOOGLE_DRIVE_REFRESH_TOKEN - Long-lived refresh token from get-drive-token.js
 *   GOOGLE_DRIVE_FOLDER_ID  - ID of the private SSXI-Submissions folder
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

// Lazily initialized OAuth2 Drive client
let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!refreshToken) missing.push('GOOGLE_DRIVE_REFRESH_TOKEN');
    throw new Error(`Google Drive OAuth credentials are not configured. Missing: ${missing.join(', ')}`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  driveClient = google.drive({ version: 'v3', auth: oauth2Client });
  return driveClient;
}

/**
 * Upload a file to Google Drive.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {string} fileName
 * @returns {Promise<string>} The Google Drive file ID.
 */
export async function uploadToDrive(fileBuffer, mimeType, fileName) {
  const drive = getDriveClient();

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured.');

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: stream,
    },
    fields: 'id,name,size',
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error('Google Drive did not return a file ID after upload.');

  console.log(`Drive upload OK: "${res.data.name}" (${res.data.size || '?'} bytes) → ${fileId.slice(0, 8)}...`);
  return fileId;
}

/**
 * Get a readable stream for a file from Google Drive.
 * @param {string} fileId
 * @returns {Promise<ReadableStream>}
 */
export async function getDriveFileStream(fileId) {
  if (!fileId || fileId === 'dummy_drive_id_123') {
    throw new Error('This submission does not have a valid Google Drive file. It may have been created before Drive integration was working.');
  }

  const drive = getDriveClient();

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return res.data;
}

export default { uploadToDrive, getDriveFileStream };
