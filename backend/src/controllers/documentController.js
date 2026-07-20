const { extractTextFromBuffer } = require('../services/pdfService');
const { chunkText } = require('../services/chunkService');
const { getEmbeddingsBatch } = require('../services/embeddingService');
const { createDocument, storeChunks, getAllDocuments } = require('../services/vectorService');
const { emitProgress } = require('../socket/progressSocket');
const supabase = require('../config/supabase');

// S3 Integrations
const { GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

// const processDocument = async (documentId, s3Key, detectedType, userId) => {
//   try {
//     console.log(`Starting background processing for S3 Key: ${s3Key}`);
//     emitProgress(documentId, 10);

//     // 1. Download file directly from S3 into memory
//     const command = new GetObjectCommand({
//       Bucket: process.env.AWS_S3_BUCKET,
//       Key: s3Key,
//     });

//     const s3Response = await s3.send(command);
    
//     // Assemble the S3 stream into a memory buffer
//     const chunksBuffer = [];
//     for await (const chunk of s3Response.Body) {
//       chunksBuffer.push(chunk);
//     }
//     const fileBuffer = Buffer.concat(chunksBuffer);
//     emitProgress(documentId, 20);

//     // 2. Pass the S3 buffer directly 
//     // let text = '';
//     // if (detectedType === 'pdf') {
//     //   const result = await extractTextFromBuffer(fileBuffer, detectedType);
//     //   text = result?.text || '';
//     // } else {
//     //   text = fileBuffer.toString('utf-8');
//     // }
    
//     const { text } = await extractTextFromBuffer(fileBuffer, detectedType);

//     emitProgress(documentId, 30);

//     if (!text || !text.trim()) {
//       throw new Error('No readable text found in document');
//     }

//     // 3. Run chunking using your chunkService (using s3Key as the fallback filename)
//     const chunks = chunkText(text, s3Key);
//     emitProgress(documentId, 50);

//     // 4. Generate embeddings loop with progress bar updates
//     const embedded = [];
//     for (let i = 0; i < chunks.length; i++) {
//       const result = await getEmbeddingsBatch([chunks[i]]);
//       embedded.push(...result);
//       const progress = 50 + Math.round((i / chunks.length) * 40);
//       emitProgress(documentId, progress);
//     }

//     // 5. Save vector chunks into pgvector via your vectorService
//     await storeChunks(documentId, embedded);
//     emitProgress(documentId, 95);

//     // 6. Flip document status to ready
//     await supabase
//       .from('documents')
//       .update({ status: 'ready' })
//       .eq('id', documentId);

//     emitProgress(documentId, 100);
//     console.log(`Successfully completed RAG matrix processing for ${s3Key}`);

//   } catch (err) {
//     console.error('Background Processing failed:', err);
//     await supabase
//       .from('documents')
//       .update({ status: 'failed' })
//       .eq('id', documentId);
    
//     // Alert the frontend via socket that it failed
//     emitProgress(documentId, 0); 
//   }
// };

const listDocuments = async (req, res) => {
  try {
    const documents = await getAllDocuments(req.user.id);
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeDocument = async (req, res) => {
  const { id } = req.params;

  try {
    //Fetch the document first to get the s3_key
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('s3_key')
      .eq('id', id)
      .single();

    if (fetchError || !document) {
      return res.status(404).json({ message: 'Document not found in database' });
    }

    // Issue a Delete command to AWS S3 if a key exists
    if (document.s3_key) {
      console.log(`Deleting physical object from S3: ${document.s3_key}`);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: document.s3_key,
      });
      await s3.send(deleteCommand);
    }

    await supabase.from('documents').delete().eq('id', id);

    res.json({ message: 'Document successfully wiped from S3 and Database' });
} catch (err) {
    console.error('Failed to remove document completely:', err);
    res.status(500).json({ message: err.message });
  }
  // try {
  //   await supabase.from('documents').delete().eq('id', id);
  //   res.json({ message: 'Document deleted' });
  // } catch (err) {
  //   res.status(500).json({ message: err.message });
  // }
};

module.exports = { listDocuments, removeDocument, processDocument, createDocument };
