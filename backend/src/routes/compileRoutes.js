const express = require('express');
const router = express.Router();
const compileController = require('../controllers/compileController');

// POST /api/v1/compile - Compiles and runs user code
router.post('/', compileController.compileAndRun);

module.exports = router;
