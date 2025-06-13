const router = require('express').Router();
const Recommendation = require('../models/Recommendation');
const authMiddleware = require('../middlewares/auth');
const { savedRecommendation } = require('../controllers/RecommendationController');


router.post('/save',authMiddleware ,savedRecommendation);


module.exports = router;