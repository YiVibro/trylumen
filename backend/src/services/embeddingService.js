const genAI = require('../config/gemini');

const model = genAI.getGenerativeModel({
  model:'gemini-embedding-2',
  config:{outputDimensionality: 768} 
});

const getEmbedding = async (text) => {

  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }
const result = await model.embedContent({
  content: {
    parts: [
      {
        text: text.trim()
      }
    ]
  },
  outputDimensionality: 768
});

  const embedding = result.embedding.values;

  return embedding;
};

const getEmbeddingsBatch = async (chunks) => {
  const results = [];

  for (const chunk of chunks) {
    // Skip empty chunks
    if (!chunk.text || chunk.text.trim().length === 0) {
      continue;
    }

    const embedding = await getEmbedding(chunk.text);
    results.push({
      ...chunk,
      embedding,
    });

    await new Promise(res => setTimeout(res, 100));
  }

  return results;
};

module.exports = { getEmbedding, getEmbeddingsBatch };