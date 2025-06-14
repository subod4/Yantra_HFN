const router = require('express').Router();
const Recommendation = require('../models/Recommendation');
const authMiddleware = require('../middlewares/auth');
const { savedRecommendation, getRecommendations, deleteRecommendationbyId } = require('../controllers/RecommendationController');


router.post('/save',authMiddleware ,savedRecommendation);

router.get('/', authMiddleware,getRecommendations);

router.delete('/:id', authMiddleware, deleteRecommendationbyId);

module.exports = router;