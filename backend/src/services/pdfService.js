// backend/src/services/pdfService.js

// We removed fs and path entirely — no server disk interaction!
const extractText = async (fileBuffer) => {
  const SmartParser = require('pdf-parse-new/lib/SmartPDFParser');
  const parser = new SmartParser();

  try {
    // Pass the S3 buffer directly to the parser!
    const result = await parser.parse(fileBuffer);

    return {
      text: result.text,
    };
  } catch (error) {
    console.error('Extraction Error:', error);
    throw error; // Throw so the background worker catch block can mark it as 'failed'
  }
};

module.exports = { extractText };

// const fs = require('fs');
// const path = require('path');

// const extractText = async (filePath)=>{

//     const SmartParser = require('pdf-parse-new/lib/SmartPDFParser');

//     const parser = new SmartParser();

//       const pdfPath=filePath;
//     try {
//             const dataBuffer = fs.readFileSync(pdfPath);
            
//             const result = await parser.parse(dataBuffer);

//             return {
//                 text:result.text,
//             }
//     }catch (error) {
//         console.error('Extraction Error:', error);
//     }
// }

// module.exports = { extractText };