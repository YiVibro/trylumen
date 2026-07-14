const supabase = require('../config/supabase');

// Store all embedded chunks for a document
const storeChunks = async (documentId, embeddedChunks) => {
  const rows = embeddedChunks.map(chunk => ({
    document_id: documentId,
    chunk_index: chunk.index,
    text: chunk.text,
    source: chunk.source,
    embedding: chunk.embedding,
  }));

  const { data, error } = await supabase
    .from('chunks')
    .insert(rows);

  if (error) throw new Error(`Failed to store chunks: ${error.message}`);
  return data;
};

// Search for similar chunks using cosine similarity
const searchSimilarChunks = async (queryText,queryEmbedding, topK = 5,documentIds=[]) => {

  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: queryText,
    query_embedding: queryEmbedding,
    match_count: topK,
    filter_document_ids: documentIds.length > 0 ? documentIds : null
  });

  if (error) throw new Error(`Search failed: ${error.message}`);
  return data || [];
};

const createDocument = async (filename, s3Key, userId, status='pending') => {
  const { data, error } = await supabase
    .from('documents')
    .insert({ filename, s3_key: s3Key, uploaded_by: userId, status })
    .select()
    .single();

  if (error) throw new Error(`Failed to create document: ${error.message}`);
  return data;
};

const getAllDocuments = async () => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { storeChunks, searchSimilarChunks, createDocument, getAllDocuments };