const { getEmbedding } = require('../services/embeddingService');
const { searchSimilarChunks } = require('../services/vectorService');
const genAI = require('../config/gemini');

const query = async (req, res) => {
  const { query, documentIds, history=[] } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // let overallContext = query;
    // if(history.length>0){
    //   const historyText=history.slice(-4)
    //        .map(m => `${m.role}: ${m.content}`)
    //        .join('\n');

    // // Use Gemini to rewrite ambiguous queries
    // const rewriteModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    // const rewritePrompt = `Given this conversation:\n${lastTurns}\n\nRewrite this follow-up question as a standalone query: "${query}"\n\nStandalone query:`;
    // const rewritten = await rewriteModel.generateContent(rewritePrompt);
    // overallContext = rewritten.response.text().trim();
    // }
   
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Search similar chunks
    const sources = await searchSimilarChunks(query,queryEmbedding, 5,documentIds);

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


    // Build conversation history string
    const conversationContext = history.length > 0
      ? history.slice(-4) // last 4 messages only
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : '';


    // Call Gemini to generate answer
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//     const prompt = `You are a helpful assistant. Answer the question using ONLY the context provided below.
// If the answer is not in the context, say "I don't have enough information to answer that."
// Always be concise and accurate.

// Context:
// ${context}

// Question: ${query}

// Answer:`;
 const prompt = `You are a helpful assistant. Answer using the document context provided.
If the question refers to something from the conversation history, use that.
If the answer is not in context or history, say "I don't have enough information."

${conversationContext ? `Conversation so far:\n${conversationContext}\n` : ''}

Document Context:
${context}

Current Question: ${query}

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