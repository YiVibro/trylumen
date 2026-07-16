
// const extractText = async (fileBuffer) => {

//   const SmartParser = require('pdf-parse-new/lib/SmartPDFParser');
//   const parser = new SmartParser();

//   try {
//     // Pass the S3 buffer directly to the parser!
//     const result = await parser.parse(fileBuffer);

//     return {
//       text: result.text,
//     };
//   } catch (error) {
//     console.error('Extraction Error:', error);
//     throw error; // Throw so the background worker catch block can mark it as 'failed'
//   }
// };

// module.exports = { extractText };

const fs = require('fs');
const SmartParser = require('pdf-parse-new/lib/SmartPDFParser');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

const extractTextFromBuffer = async (fileBuffer, fileType) => {
  try {
    let extractedText = '';

    switch (fileType.toLowerCase()) {
      case 'pdf': {
        const parser = new SmartParser();
        const result = await parser.parse(fileBuffer);
        extractedText = result.text;
        break;
      }

      case 'docx': {
        // Mammoth converts word documents directly into plain text or HTML strings
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value; 
        break;
      }

      case 'txt':
      case 'md': {
        // Plain text files just need standard string decoding
        extractedText = fileBuffer.toString('utf-8');
        break;
      }

      case 'png':
      case 'jpg':
      case 'jpeg': {
        // Processes images using OCR
        const { data: { text } } = await Tesseract.recognize(
          fileBuffer,
          'eng', // Language training set (English)
          { logger: m => console.log(`[OCR Progress]: ${m.status} - ${Math.round(m.progress * 100)}%`) }
        );
        extractedText = text;
        break;
      }

      default:
        throw new Error(`Unsupported file type extension: ${fileType}`);
    }

    return { text: extractedText || '' };

  } catch (error) {
    console.error(`Extraction Error for type [${fileType}]:`, error);
    throw new Error(`Failed to extract layout elements from ${fileType} file.`);
  }
};

module.exports = { extractTextFromBuffer };