const CHUNK_SIZE = 500;
const OVERLAP = 50;

const chunkText = (text, filePath) => {
  // Split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  const chunks = [];
  let buffer = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const words = (buffer + ' ' + para).trim().split(' ');
    if (words.length > 500) {
      if (buffer.trim()) {
        chunks.push({ index: chunkIndex++, text: buffer.trim(), source: filePath });
      }
      buffer = para;
    } else {
      buffer = words.join(' ');
    }
  }
  if (buffer.trim()) {
    chunks.push({ index: chunkIndex++, text: buffer.trim(), source: filePath });
  }
  return chunks;
};
// const chunkText = (text, filePath, chunkSize = CHUNK_SIZE, overlap = OVERLAP) => {
//   const cleaned = text.replace(/\s+/g, ' ').trim();
//   const words = cleaned.split(' ');

//   const chunks = [];
//   let i = 0;
//   let chunkIndex = 0;

//   while (i < words.length) {
//     const chunkWords = words.slice(i, i + chunkSize);
//     const chunkText = chunkWords.join(' ').trim();

//     // Skip empty or very short chunks
//     if (chunkText.length > 50) {
//       chunks.push({
//         index: chunkIndex,
//         text: chunkText,
//         wordCount: chunkWords.length,
//         source: filePath,
//       });
//       chunkIndex++;
//     }

//     i += chunkSize - overlap;
//   }

//   return chunks;
// };

module.exports = { chunkText };
