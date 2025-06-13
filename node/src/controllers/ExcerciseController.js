const mongoose = require("mongoose");
const ExerciseSession = require("../models/ExcerciseSession");

const createExcerciseSession = async (req, res) => {
  try {
    const { userId, ...rest } = req.body;

    // Check if userId from body matches authenticated user ID
    if (!userId || userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "User ID mismatch or not authorized to create session"
      });
    }

    // Proceed to create the session
    const session = new ExerciseSession({
      userId,
      ...rest
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error("Error creating exercise session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save session"
    });
  }
};

module.exports = {
  createExcerciseSession
};
