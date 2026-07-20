// lambdas/worker.js
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const { extractTextFromBuffer } = require('../services/pdfService'); // Plugs right into your current code!
const { chunkText } = require('../services/chunkService');
const { getEmbeddingsBatch } = require('../services/embeddingService');

const s3 = new S3Client({ region: process.env.AWS_REGION });
// Use Service Role Client to completely bypass database RLS checks securely
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (payload) => {
  const { documentId, s3Key, bucket, userId, startPage, endPage, chunkIndex } = payload;

  try {
    // 1. Fetch document stream targeting specific byte range (or load full object into memory if size permits)
    const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
    const s3Response = await s3.send(command);
    
    const chunksBuffer = [];
    for await (const chunk of s3Response.Body) { chunksBuffer.push(chunk); }
    const fileBuffer = Buffer.concat(chunksBuffer);

    // 2. Extract specific page array context window
    const { text } = await extractTextFromBuffer(fileBuffer, 'pdf', { startPage, endPage });
    
    if (!text || !text.trim()) return;

    // 3. Transform text array into vector matrices
    const chunks = chunkText(text, s3Key);
    const embedded = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const result = await getEmbeddingsBatch([chunks[i]]);
      embedded.push(...result);
    }

    // 4. Save to pgvector table format (Order remains safe thanks to chunkIndex tracking)
    const rows = embedded.map((chunk, idx) => ({
      document_id: documentId,
      chunk_index: `${chunkIndex}_${idx}`, // 👈 Ensures unique sequence keys across concurrent writes
      text: chunk.text,
      source: chunk.source,
      embedding: chunk.embedding,
    }));

    await supabase.from('chunks').insert(rows);

    // 5. Completion Gate Check (Fan-In Check)
    // Run an atomic check query or check for sibling marker files to flip document status to 'ready'
    
  } catch (err) {
    console.error(`Worker crash on range ${startPage}-${endPage}:`, err);
    // Switch document entry to failed state if tracking recovery fails
  }
};