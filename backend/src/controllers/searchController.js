const { getEmbedding } = require('../services/embeddingService');
const { searchSimilarChunks } = require('../services/vectorService');
const genAI = require('../config/gemini');

const query = async (req, res) => {
  const { query, documentIds } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Search similar chunks
    const sources = await searchSimilarChunks(queryEmbedding, 5);

    if (!sources || sources.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents.",
        sources: [],
      });
    }

    // Build context from chunks
    const context = sources
      .map((s, i) => `[Source ${i + 1} - ${s.source}]:\n${s.text}`)
      .join('\n\n');

    // Call Gemini to generate answer
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a helpful assistant. Answer the question using ONLY the context provided below.
If the answer is not in the context, say "I don't have enough information to answer that."
Always be concise and accurate.

Context:
${context}

Question: ${query}

Answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({ answer, sources });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { query };