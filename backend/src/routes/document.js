const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const { requestUpload, confirmUpload } = require('../controllers/uploadController');
const { listDocuments, removeDocument } = require('../controllers/documentController');

const router = express.Router();

// No multer needed anymore — files go directly to S3
router.post('/upload/request', authMiddleware, requestUpload);
router.post('/upload/confirm', authMiddleware, confirmUpload);
router.get('/', authMiddleware, listDocuments);
router.delete('/:id', authMiddleware, removeDocument);//, rbacMiddleware('admin'),

module.exports = router;