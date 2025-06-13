const Recommendation = require("../models/Recommendation");

const savedRecommendation = async (req, res) => {
  try {
    const newRecommendation = new Recommendation({
      userId: req.user._id,
      injuryType: req.body.injuryType,
      duration: req.body.duration,
      severity: req.body.severity,
      details: req.body.details,
      exercises: req.body.exercises,
      acceptanceDate: req.body.acceptanceDate,
    });

    const savedRecommendation = await newRecommendation.save();

    res.status(201).json({
      success: true,
      recommendation: savedRecommendation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save recommendation",
    });
  }
};

const getRecommendations = async (req, res) => {
  try {

    const recommendations = await Recommendation.find({ userId: req.user._id});
    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
};

const deleteRecommendationbyId = async (req, res) => {
  try {
    const recId = req.params.id;
    console.log(recId,req.user._id);
    const recommendation = await Recommendation.findOne({
      _id: recId,
      userId: req.user._id,
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found or not authorized",
      });
    }

    await Recommendation.deleteOne({ _id: recId });

    res.status(200).json({
      success: true,
      message: "Recommendation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete recommendation",
    });
  }
};
module.exports = {
  savedRecommendation,
  getRecommendations,
  deleteRecommendationbyId,
};
