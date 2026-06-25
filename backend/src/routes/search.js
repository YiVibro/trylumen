const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../controllers/searchController');

const router = express.Router();

router.post('/query', authMiddleware, query);

module.exports = router;