import { google } from 'googleapis';
import { Readable } from 'stream';

// Lazily initialize the Drive client to prevent errors if env vars are missing initially
let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Drive credentials are not configured.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
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
  
  if (!folderId) throw new Error('Google Drive folder ID is not configured.');

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
    fields: 'id',
  });

  return res.data.id;
}

/**
 * Get a readable stream for a file from Google Drive.
 * @param {string} fileId 
 * @returns {Promise<ReadableStream>}
 */
export async function getDriveFileStream(fileId) {
  const drive = getDriveClient();
  
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return res.data;
}

export default { uploadToDrive, getDriveFileStream };
