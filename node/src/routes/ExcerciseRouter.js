const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { create } = require('../models/ExcerciseSession');
const { createExcerciseSession } = require('../controllers/ExcerciseController');
// Create new exercise session
router.post('/session', authMiddleware,createExcerciseSession);


module.exports = router;