const fs = require('fs');
const path = require('path');

const extractText = async (filePath)=>{

    const SmartParser = require('pdf-parse-new/lib/SmartPDFParser');

    const parser = new SmartParser();

      const pdfPath=filePath;
    try {
            const dataBuffer = fs.readFileSync(pdfPath);
            
            const result = await parser.parse(dataBuffer);

            return {
                text:result.text,
            }
    }catch (error) {
        console.error('Extraction Error:', error);
    }
}

module.exports = { extractText };