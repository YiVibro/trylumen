import { getEmbedding } from './embeddingService.js';
import { searchSimilarChunks } from './vectorService.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import genAI from '../config/gemini.js';


 //This function takes a user's question and returns a synthesized answer based on PDF context.
 
export const generateAnswer = async (question) => {
  try {
    // Convert user's question into a vector

    const queryEmbedding = await getEmbedding(question);

    // Retrieve relevant context from Supabase
    const contextChunks = await searchSimilarChunks(question,queryEmbedding, 5);

    if (!contextChunks || contextChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the uploaded documents to answer that question.",
        sources: []
      };
    }

    // Construct the Context String
    const contextText = contextChunks
      .map((chunk, index) => `[Source ${index + 1}]: ${chunk.text}`)
      .join('\n\n');

    // Prompt Engineering for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an AI assistant specialized in analyzing technical documents.
      Use the provided context to answer the user's question accurately.
      
      RULES:
      1. If the answer is not in the context, say you don't know.
      2. Keep the answer professional and concise.
      3. Cite your sources using [Source X] notation.

      CONTEXT:
      ${contextText}

      USER QUESTION:
      ${question}
    `;

    // Generate Response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      answer: response.text(),
      sources: contextChunks.map(c => ({
        id: c.id,
        text: c.text.slice(0, 100) + "...",
        source: c.source
      }))
    };

  } catch (error) {
    console.error("RAG Service Error:", error);
    throw new Error("Failed to process the question through the RAG pipeline.");
  }
};