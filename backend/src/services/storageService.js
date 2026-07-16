const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../config/s3');

const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

const BUCKET = process.env.AWS_S3_BUCKET;

// Generate presigned URL for client to upload directly to S3
const generateUploadUrl = async (filename, mimeType, userId) => {
  // Never use the original filename — generate a safe key
  const ext = getExtFromMime(mimeType);
  const safeKey = `uploads/${userId}/${uuidv4()}.${ext}`;

  // const command = new PutObjectCommand({
  //   Bucket: BUCKET,
  //   Key: safeKey,
  //   ContentType: mimeType,
  //   // Metadata stored with the file
  //   Metadata: {
  //     userId,
  //     originalName: Buffer.from(filename).toString('base64'), // encode safely
  //     uploadedAt: new Date().toISOString()
  //   }
  // });

  // // URL expires in 5 minutes — client must upload within this window
  // const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  //added later
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: safeKey,
    Expires: 300, // Link stays alive for exactly 5 minutes
    Conditions: [
      ['content-length-range', 0, 52428800], // 🛡️ Gateway Constraint: File size MUST be between 0 bytes and 50MB
      {'content-type': mimeType}
    ],
    Fields: {
      'x-amz-meta-userid': userId,
      'x-amz-meta-originalname': Buffer.from(filename).toString('base64') // Safe metadata mapping
    }
  });

  return { presignedUrl:url, fields,s3Key: safeKey };
};

// Generate signed download URL — never expose S3 directly
const generateDownloadUrl = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key
  });

  // URL expires in 1 hour
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};

const getExtFromMime = (mimeType) => {
  const map = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a'
  };
  return map[mimeType] || 'bin';
};

module.exports = { generateUploadUrl, generateDownloadUrl };