const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const {
  uploadDocument,
  listDocuments,
  removeDocument
} = require('../controllers/documentController');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.get('/', authMiddleware, listDocuments);
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.delete('/:id', authMiddleware, rbacMiddleware('admin'), removeDocument);

module.exports = router;