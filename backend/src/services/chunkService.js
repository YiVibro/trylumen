const CHUNK_SIZE = 500;
const OVERLAP = 50;

const chunkText = (text, filePath, chunkSize = CHUNK_SIZE, overlap = OVERLAP) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');

  const chunks = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ').trim();

    // Skip empty or very short chunks
    if (chunkText.length > 50) {
      chunks.push({
        index: chunkIndex,
        text: chunkText,
        wordCount: chunkWords.length,
        source: filePath,
      });
      chunkIndex++;
    }

    i += chunkSize - overlap;
  }

  return chunks;
};

module.exports = { chunkText };
