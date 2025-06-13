const ExerciseSession = require("../models/ExcerciseSession");

const createExcerciseSession = async (req, res) => {
  try {
    const session = new ExerciseSession({
      userId: req.user._id,
      ...req.body
    });

    await session.save();
    
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save session'
    });
  }
}


module.exports = {
  createExcerciseSession
};