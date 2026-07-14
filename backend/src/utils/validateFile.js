const SIGNATURES = {
  pdf: {
    bytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    mimeType: 'application/pdf'
  },
  png: {
    bytes: [0x89, 0x50, 0x4E, 0x47], // .PNG
    mimeType: 'image/png'
  },
  jpeg: {
    bytes: [0xFF, 0xD8, 0xFF],        // JFIF/EXIF
    mimeType: 'image/jpeg'
  },
  mp3: {
    bytes: [0x49, 0x44, 0x33],        // ID3
    mimeType: 'audio/mpeg'
  },
  mp4: {
    bytes: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
    mimeType: 'audio/mp4'
  }
};

const readMagicBytes = (buffer, length) => {
  return Array.from(buffer.slice(0, length));
};

const matchesSignature = (buffer, signature) => {
  const bytes = readMagicBytes(buffer, signature.bytes.length);
  return signature.bytes.every((byte, i) => bytes[i] === byte);
};

const validateFileBuffer = (buffer, declaredMimeType) => {
  // Check against all known signatures
  for (const [type, signature] of Object.entries(SIGNATURES)) {
    if (matchesSignature(buffer, signature)) {
      return {
        valid: true,
        detectedType: type,
        mimeType: signature.mimeType
      };
    }
  }

  return {
    valid: false,
    detectedType: null,
    mimeType: null,
    reason: 'File content does not match any allowed type'
  };
};

// Allowed combinations
const ALLOWED_TYPES = ['pdf', 'png', 'jpeg', 'mp3', 'mp4'];

const isAllowedType = (detectedType) => {
  return ALLOWED_TYPES.includes(detectedType);
};

module.exports = { validateFileBuffer, isAllowedType };