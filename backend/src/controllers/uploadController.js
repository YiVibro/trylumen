const { generateUploadUrl } = require('../services/storageService');
const { validateFileBuffer, isAllowedType } = require('../utils/validateFile');
const { createDocument, processDocument } = require('./documentController');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
const supabase = require('../config/supabase');

const requestUpload = async (req, res) => {
  const { filename, mimeType, fileSize } = req.body;

  const MAX_SIZE = 50 * 1024 * 1024;
  if (fileSize > MAX_SIZE) {
    return res.status(400).json({ message: 'File too large. Maximum 50MB allowed.' });
  }

  const allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'audio/mpeg',
    'audio/mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 
  ];

  if (!allowedMimes.includes(mimeType)) {
    return res.status(400).json({ message: 'File type not allowed' });
  }

  try {
    const { presignedUrl, s3Key } = await generateUploadUrl(
      filename,
      mimeType,
      req.user.id
    );

    const doc = await createDocument(filename, s3Key, req.user.id, 'pending');

    res.json({
      presignedUrl,
      s3Key,
      documentId: doc.id
    });
  } catch (err) {
    console.error('Error inside requestUpload:', err);
    res.status(500).json({ message: err.message });
  }
};

const confirmUpload = async (req, res) => {
  const { documentId, s3Key } = req.body;

  try {
    // Fetch first 16 bytes only for magic bytes check
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Range: 'bytes=0-15'
    });

    const response = await s3.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const headerBuffer = Buffer.concat(chunks);

    // Validate magic bytes
    const { valid, detectedType } = validateFileBuffer(headerBuffer);

    if (!valid || !isAllowedType(detectedType)) {
      // Delete invalid file from S3
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key
      }));

      await supabase
        .from('documents')
        .update({ status: 'failed', error_message: 'Invalid file content' })
        .eq('id', documentId);

      return res.status(400).json({ message: 'File content invalid. Upload rejected.' });
    }

    res.json({ message: 'Upload confirmed. Processing started.' });
    // errors here go to logs
    processDocument(documentId, s3Key, detectedType, req.user.id)
      .catch(err => console.error('Background processing failed:', err));

  } catch (err) {
    console.error('Error inside confirmUpload:', err);
    // Only send error if headers not already sent
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = { requestUpload, confirmUpload };

// const { generateUploadUrl } = require('../services/storageService');
// const { validateFileBuffer, isAllowedType } = require('../utils/validateFile');
// const { createDocument } = require('../services/vectorService');
// const supabase = require('../config/supabase');

// // Step 1: Client requests presigned URL
// const requestUpload = async (req, res) => {
//   const { filename, mimeType, fileSize } = req.body;

//   // Size limit — 50MB
//   const MAX_SIZE = 50 * 1024 * 1024;
//   if (fileSize > MAX_SIZE) {
//     return res.status(400).json({ 
//       message: 'File too large. Maximum 50MB allowed.' 
//     });
//   }

//   // Validate declared mime type is allowed
//   const allowedMimes = [
//     'application/pdf', 
//     'image/png', 
//     'image/jpeg',
//     'audio/mpeg', 
//     'audio/mp4'
//   ];

//   if (!allowedMimes.includes(mimeType)) {
//     return res.status(400).json({ 
//       message: 'File type not allowed' 
//     });
//   }

//   try {
//     const { presignedUrl, s3Key } = await generateUploadUrl(
//       filename, 
//       mimeType, 
//       req.user.id
//     );

//     // Create document record as 'pending' — not ready yet
//     const doc = await createDocument(filename, s3Key, req.user.id, 'pending');

//     res.json({ 
//       presignedUrl,  // client uploads directly to S3 with this
//       s3Key,
//       documentId: doc.id
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Step 2: Client tells backend upload is done
// // Backend validates magic bytes THEN processes
// const confirmUpload = async (req, res) => {
//   const { documentId, s3Key } = req.body;

//   try {
//     // Download just the first 16 bytes from S3 to check magic bytes
//     const { GetObjectCommand } = require('@aws-sdk/client-s3');
//     const s3 = require('../config/s3');

//     const command = new GetObjectCommand({
//       Bucket: process.env.AWS_S3_BUCKET,
//       Key: s3Key,
//       Range: 'bytes=0-15' // only first 16 bytes — magic bytes check
//     });

//     const response = await s3.send(command);
//     const chunks = [];
//     for await (const chunk of response.Body) {
//       chunks.push(chunk);
//     }
//     const headerBuffer = Buffer.concat(chunks);

//     // Validate magic bytes
//     const { valid, detectedType } = validateFileBuffer(headerBuffer);

//     if (!valid || !isAllowedType(detectedType)) {
//       // Delete the invalid file from S3
//       const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
//       await s3.send(new DeleteObjectCommand({
//         Bucket: process.env.AWS_S3_BUCKET,
//         Key: s3Key
//       }));

//       // Mark document as failed
//       await supabase
//         .from('documents')
//         .update({ status: 'failed', error_message: 'Invalid file content' })
//         .eq('id', documentId);

//       return res.status(400).json({ 
//         message: 'File content invalid. Upload rejected.' 
//       });
//     }

//     // Valid file — start async processing
//     res.json({ message: 'Upload confirmed. Processing started.' });

//     // Process asynchronously AFTER responding
//     processDocument(documentId, s3Key, detectedType, req.user.id);

//   } catch (err) {
//    // res.status(500).json({ message: err.message });

// console.error("Error inside confirmUpload:", err);
//    if (res.headersSent) {
//       console.error("Headers already sent. Shifting crash handling to background log.");
//       return; 
//     }
//     // Only respond with 500 if the headers haven't been sent yet
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { requestUpload, confirmUpload };