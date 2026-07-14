const { extractText } = require('../services/pdfService');
const { chunkText } = require('../services/chunkService');
const { getEmbeddingsBatch } = require('../services/embeddingService');
const { createDocument, storeChunks, getAllDocuments } = require('../services/vectorService');
const { emitProgress } = require('../socket/progressSocket');
const supabase = require('../config/supabase');

// S3 Integrations
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

// 💡 Note: uploadDocument is no longer needed since frontend uploads directly to S3,
// but we keep processDocument, listDocuments, and removeDocument working perfectly.

const processDocument = async (documentId, s3Key, detectedType, userId) => {
  try {
    console.log(`Starting background processing for S3 Key: ${s3Key}`);
    emitProgress(documentId, 10);

    // 1. Download file directly from S3 into memory
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    });
    const s3Response = await s3.send(command);
    
    // Assemble the S3 stream into a memory buffer
    const chunksBuffer = [];
    for await (const chunk of s3Response.Body) {
      chunksBuffer.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunksBuffer);
    emitProgress(documentId, 20);

    // 2. Pass the S3 buffer directly to your updated pdfService
    let text = '';
    if (detectedType === 'pdf') {
      const result = await extractText(fileBuffer); // 👈 Passes the memory buffer directly
      text = result?.text || '';
    } else {
      text = fileBuffer.toString('utf-8');
    }

    emitProgress(documentId, 30);

    if (!text || !text.trim()) {
      throw new Error('No readable text found in document');
    }

    // 3. Run chunking using your chunkService (using s3Key as the fallback filename)
    const chunks = chunkText(text, s3Key);
    emitProgress(documentId, 50);

    // 4. Generate embeddings loop with progress bar updates
    const embedded = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await getEmbeddingsBatch([chunks[i]]);
      embedded.push(...result);
      const progress = 50 + Math.round((i / chunks.length) * 40);
      emitProgress(documentId, progress);
    }

    // 5. Save vector chunks into pgvector via your vectorService
    await storeChunks(documentId, embedded);
    emitProgress(documentId, 95);

    // 6. Flip document status to ready
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId);

    emitProgress(documentId, 100);
    console.log(`Successfully completed RAG matrix processing for ${s3Key}`);

    // 🎉 Local fs.unlinkSync() is completely removed because nothing touched your disk!

  } catch (err) {
    console.error('Background Processing failed:', err);
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId);
    
    // Alert the frontend via socket that it failed
    emitProgress(documentId, 0); 
  }
};

const listDocuments = async (req, res) => {
  try {
    const documents = await getAllDocuments();
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('documents').delete().eq('id', id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { listDocuments, removeDocument, processDocument, createDocument };

// const { v4: uuidv4 } = require('uuid');
// const { extractText } = require('../services/pdfService');
// const { chunkText } = require('../services/chunkService');
// const { getEmbeddingsBatch } = require('../services/embeddingService');
// const { createDocument, storeChunks, getAllDocuments } = require('../services/vectorService');
// const { emitProgress } = require('../socket/progressSocket');
// const supabase = require('../config/supabase');
// const fs = require('fs');

// const uploadDocument = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const { originalname, path: filePath } = req.file;

//   try {
//     // Create document record immediately
//     const doc = await createDocument(originalname, filePath);
//     res.json({ message: 'Upload started', documentId: doc.id });

//     // Process in background
//     processDocument(doc.id, filePath, originalname);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const processDocument = async (documentId, filePath, filename) => {
//   try {
//     emitProgress(documentId, 10);

//     // Extract text
//     const { text } = await extractText(filePath);
//     emitProgress(documentId, 30);


//     const chunks = chunkText(text, filename);
//     emitProgress(documentId, 50);

//     const embedded = [];
//     for (let i = 0; i < chunks.length; i++) {
//       const result = await getEmbeddingsBatch([chunks[i]]);
//       embedded.push(...result);
//       const progress = 50 + Math.round((i / chunks.length) * 40);
//       emitProgress(documentId, progress);
//     }

//     await storeChunks(documentId, embedded);
//     emitProgress(documentId, 95);

//     await supabase
//       .from('documents')
//       .update({ status: 'ready' })
//       .eq('id', documentId);

//     emitProgress(documentId, 100);

//     fs.unlinkSync(filePath);

//   } catch (err) {
//     console.error('Processing failed:', err);
//     await supabase
//       .from('documents')
//       .update({ status: 'failed' })
//       .eq('id', documentId);
//   }
// };

// const listDocuments = async (req, res) => {
//   try {
//     const documents = await getAllDocuments();
//     res.json(documents);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const removeDocument = async (req, res) => {
//   const { id } = req.params;
//   try {
//     await supabase.from('documents').delete().eq('id', id);
//     res.json({ message: 'Document deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { uploadDocument, listDocuments, removeDocument, processDocument, createDocument };