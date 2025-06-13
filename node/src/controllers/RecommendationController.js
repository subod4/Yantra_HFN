const Recommendation = require('../models/Recommendation');

const savedRecommendation = async (req, res) => {
  try {
    const newRecommendation = new Recommendation({
      userId: req.body.userId || req.userId,
      injuryType: req.body.injuryType,
      duration: req.body.duration,
      severity: req.body.severity,
      details: req.body.details,
      exercises: req.body.exercises,
      acceptanceDate: req.body.acceptanceDate
    });

    const savedRecommendation = await newRecommendation.save();
    
    res.status(201).json({
      success: true,
      recommendation: savedRecommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save recommendation'
    });
  }
};

module.exports = {savedRecommendation};