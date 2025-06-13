const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { create } = require('../models/ExcerciseSession');
const { createExcerciseSession, getExcerciseSessions } = require('../controllers/ExcerciseController');
// Create new exercise session
router.post('/session', authMiddleware,createExcerciseSession);

//get all exercise sessions for the authenticated user
router.get('/sessions', authMiddleware,getExcerciseSessions);


module.exports = router;