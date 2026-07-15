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
module.exports = { chunkText };
