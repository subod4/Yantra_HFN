const mongoose = require("mongoose");
const ExerciseSession = require("../models/ExcerciseSession");

const createExcerciseSession = async (req, res) => {
  try {
    const { userId, ...rest } = req.body;

    // Check if userId from body matches authenticated user ID
    if (!userId || userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "User ID mismatch or not authorized to create session",
      });
    }

    // Proceed to create the session
    const session = new ExerciseSession({
      userId,
      ...rest,
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error creating exercise session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save session",
    });
  }
};

const getExcerciseSessions = async (req, res) => {
  try {
    const sessions = await ExerciseSession.find({ userId: req.user._id })
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

const deleteExcerciseSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await ExerciseSession.findOne({ _id: sessionId, userId: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exercise session not found or not authorized'
      });
    }

    await ExerciseSession.deleteOne({ _id: sessionId });
    
    res.status(200).json({
      success: true,
      message: 'Exercise session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
};

module.exports = {
  createExcerciseSession,
  getExcerciseSessions,
  deleteExcerciseSession
};
