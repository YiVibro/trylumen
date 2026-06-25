const { v4: uuidv4 } = require('uuid');
const { extractText } = require('../services/pdfService');
const { chunkText } = require('../services/chunkService');
const { getEmbeddingsBatch } = require('../services/embeddingService');
const { createDocument, storeChunks, getAllDocuments } = require('../services/vectorService');
const { emitProgress } = require('../socket/progressSocket');
const supabase = require('../config/supabase');
const fs = require('fs');

const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { originalname, path: filePath } = req.file;

  try {
    // Create document record immediately
    const doc = await createDocument(originalname, filePath);
    res.json({ message: 'Upload started', documentId: doc.id });

    // Process in background
    processDocument(doc.id, filePath, originalname);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const processDocument = async (documentId, filePath, filename) => {
  try {
    emitProgress(documentId, 10);

    // Extract text
    const { text } = await extractText(filePath);
    emitProgress(documentId, 30);


    const chunks = chunkText(text, filename);
    emitProgress(documentId, 50);

    const embedded = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await getEmbeddingsBatch([chunks[i]]);
      embedded.push(...result);
      const progress = 50 + Math.round((i / chunks.length) * 40);
      emitProgress(documentId, progress);
    }

    await storeChunks(documentId, embedded);
    emitProgress(documentId, 95);

    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId);

    emitProgress(documentId, 100);

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error('Processing failed:', err);
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', documentId);
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

module.exports = { uploadDocument, listDocuments, removeDocument };