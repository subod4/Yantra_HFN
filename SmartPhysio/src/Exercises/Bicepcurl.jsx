import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pose } from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import bicep from "/bicep.mp4";

const FEEDBACK_INTERVAL = 3000; // ms

// Helper function to draw a rounded rectangle.
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};


const ExercisePose = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("Press Start to begin");
  const [camera, setCamera] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState("down");
  const [showReport, setShowReport] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    duration: 0,
    reps: 0,
    avgTimePerRep: 0,
    energy: 0,
    formScore: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [energy, setEnergy] = useState(0);
  const prevElbowAngleRef = useRef(null);
  const prevTimestampRef = useRef(null);
  const stageRef = useRef(stage);
  const formQualityCounts = useRef({ poor: 0, fair: 0, good: 0 });

  const [speakingText, setSpeakingText] = useState("");
  const lastFeedbackSent = useRef(Date.now());
  const latestPoseData = useRef(null);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (!isCameraActive || isPaused) return;
    const interval = setInterval(() => {
      if (latestPoseData.current) {
        sendLiveFeedback(latestPoseData.current);
      }
    }, FEEDBACK_INTERVAL);
    return () => clearInterval(interval);
  }, [isCameraActive, isPaused]);

  useEffect(() => {
    let cameraInstance;
    let timerInterval;
    let poseInstance;

    const loadPoseLibrary = async () => {
      // ... (rest of the Mediapipe loading logic remains the same)
      try {
        const poseScript = document.createElement("script");
        poseScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
        poseScript.async = true;

        const cameraScript = document.createElement("script");
        cameraScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
        cameraScript.async = true;

        document.body.appendChild(poseScript);
        document.body.appendChild(cameraScript);

        poseScript.onload = () => {
          poseInstance = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          poseInstance.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          poseInstance.onResults((results) => {
            const canvasElement = canvasRef.current;
            if (!canvasElement) return;
            const canvasCtx = canvasElement.getContext("2d");
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.poseLandmarks) {
              const metrics = calculateExercise(results);
              drawArmPose(results, canvasCtx);
              if (metrics) {
                // Call the new modern drawing function
                drawModernProgressBars(canvasCtx, metrics);
              }
              latestPoseData.current = {
                exercise: "bicep curl",
                rep: repCount,
                stage,
                landmarks: results.poseLandmarks,
                timestamp: Date.now(),
              };
            } else {
              setFeedback("No person detected");
            }
          });

          cameraScript.onload = () => {
            if (isCameraActive && !isPaused && videoRef.current) {
              cameraInstance = new window.Camera(videoRef.current, {
                onFrame: async () => {
                  await poseInstance.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
              });
              cameraInstance.start();
              setCamera(cameraInstance);
              setFeedback("Camera started. Begin your exercise.");
              timerInterval = setInterval(() => setTimer((prev) => prev + 1), 1000);
            }
          };
        };

        poseScript.onerror = () => setFeedback("Failed to load Mediapipe Pose library");
        cameraScript.onerror = () => setFeedback("Failed to load Mediapipe Camera library");
      } catch (error) {
        console.error("Error loading Mediapipe:", error);
        setFeedback(error?.message || "Pose detection initialization failed");
      }
    };

    if (isCameraActive && !isPaused) {
      loadPoseLibrary();
    }

    return () => {
      if (cameraInstance) cameraInstance.stop();
      if (poseInstance) poseInstance.close();
      clearInterval(timerInterval);
    };
  }, [isCameraActive, isPaused]);

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    return angle > 180 ? 360 - angle : angle;
  };

  const calculateExercise = (results) => {
    // ... (This function remains the same as your previous version)
    const landmarks = results.poseLandmarks;
    if (!landmarks) return { elbowAngle: 0, currentVelocity: 0 };
    const [rs, re, rw] = [12, 14, 16].map((i) => landmarks[i]);
    if (!rs || !re || !rw) return { elbowAngle: 0, currentVelocity: 0 };
    const elbowAngle = calculateAngle(rs, re, rw);
    const currentTimestamp = performance.now();
    let currentVelocity = 0;
    if (prevElbowAngleRef.current !== null && prevTimestampRef.current !== null) {
      const deltaAngle = elbowAngle - prevElbowAngleRef.current;
      const deltaTime = (currentTimestamp - prevTimestampRef.current) / 1000;
      if (deltaTime > 0) {
        const angularVelocity = Math.abs(deltaAngle / deltaTime);
        currentVelocity = angularVelocity;
        setVelocity(angularVelocity.toFixed(1));
        const armMass = 2, gravity = 9.81, armLength = 0.3;
        const heightChange = armLength * (1 - Math.cos(elbowAngle * Math.PI / 180));
        const workPerRep = armMass * gravity * heightChange;
        if (stageRef.current === "up" && elbowAngle < 90 && deltaAngle < 0) {
          setEnergy((prev) => prev + workPerRep);
        }
      }
    }
    prevElbowAngleRef.current = elbowAngle;
    prevTimestampRef.current = currentTimestamp;
    let newStage = stageRef.current;
    if (elbowAngle < 90) newStage = "up";
    else if (elbowAngle > 160) newStage = "down";
    if (newStage !== stageRef.current) {
      if (stageRef.current === "up" && newStage === "down") {
        setRepCount((prev) => prev + 1);
      }
      setStage(newStage);
    }
    let formQuality = "GOOD";
    formQualityCounts.current[formQuality.toLowerCase()] += 1;
    return { elbowAngle, currentVelocity };
  };

  // NEW: Modern progress bar drawing function
  const drawModernProgressBars = (canvasCtx, { elbowAngle, currentVelocity }) => {
    const canvasWidth = canvasCtx.canvas.width;
    const canvasHeight = canvasCtx.canvas.height;
    
    // --- 1. Horizontal Repetition Progress Bar (Modern) ---
    const MIN_ANGLE = 30;
    const MAX_ANGLE = 160;
    let repProgress = (MAX_ANGLE - elbowAngle) / (MAX_ANGLE - MIN_ANGLE);
    repProgress = Math.max(0, Math.min(1, repProgress)); // Clamp between 0 and 1

    const barWidth = canvasWidth * 0.6;
    const barHeight = 12;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = canvasHeight - 45;
    const barRadius = barHeight / 2;

    // Draw background
    canvasCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
    drawRoundedRect(canvasCtx, barX, barY, barWidth, barHeight, barRadius);
    canvasCtx.fill();
    
    // Draw progress fill with a gradient
    const progressWidth = barWidth * repProgress;
    const gradient = canvasCtx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, "#38b2ac"); // Teal
    gradient.addColorStop(1, "#48bb78"); // Green
    canvasCtx.fillStyle = gradient;

    if (progressWidth > 0) {
      canvasCtx.save();
      drawRoundedRect(canvasCtx, barX, barY, progressWidth, barHeight, barRadius);
      canvasCtx.clip();
      canvasCtx.fillRect(barX, barY, barWidth, barHeight);
      canvasCtx.restore();
    }
    
    // Draw text
    canvasCtx.fillStyle = "white";
    canvasCtx.font = "bold 14px 'Segoe UI', sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(`REP: ${Math.round(repProgress * 100)}%`, canvasWidth / 2, barY + barHeight / 2 + 1);


    // --- 2. Radial Speed Gauge (Modern) ---
    const gaugeCenterX = canvasWidth - 70;
    const gaugeCenterY = 70;
    const gaugeRadius = 50;
    const MAX_VELOCITY = 300;
    const speedProgress = Math.min(1, currentVelocity / MAX_VELOCITY);
    
    const startAngle = 0.75 * Math.PI; // Starts on the left
    const endAngle = 2.25 * Math.PI;   // Ends on the right
    const fullAngleRange = endAngle - startAngle;

    // Draw background arc
    canvasCtx.beginPath();
    canvasCtx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, startAngle, endAngle);
    canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    canvasCtx.lineWidth = 10;
    canvasCtx.lineCap = "round";
    canvasCtx.stroke();
    
    // Draw progress arc
    let speedColor = "#38b2ac"; // Green
    if (speedProgress > 0.8) speedColor = "#e53e3e"; // Red
    else if (speedProgress > 0.6) speedColor = "#f6e05e"; // Yellow

    if (speedProgress > 0) {
      canvasCtx.beginPath();
      canvasCtx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, startAngle, startAngle + (speedProgress * fullAngleRange));
      canvasCtx.strokeStyle = speedColor;
      canvasCtx.stroke();
    }
    
    // Draw text inside gauge
    canvasCtx.fillStyle = "white";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    
    canvasCtx.font = "bold 22px 'Segoe UI', sans-serif";
    canvasCtx.fillText(currentVelocity.toFixed(0), gaugeCenterX, gaugeCenterY - 5);
    
    canvasCtx.font = "12px 'Segoe UI', sans-serif";
    canvasCtx.fillText("°/s", gaugeCenterX, gaugeCenterY + 15);
  };


  const drawArmPose = (results, canvasCtx) => {
    // ... (This function remains the same)
    const landmarks = results.poseLandmarks;
    if (!landmarks) return;
    canvasCtx.save();
    canvasCtx.lineWidth = 5;
    canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    const drawLine = (start, end) => {
      canvasCtx.beginPath();
      canvasCtx.moveTo(landmarks[start].x * 640, landmarks[start].y * 480);
      canvasCtx.lineTo(landmarks[end].x * 640, landmarks[end].y * 480);
      canvasCtx.stroke();
    };
    drawLine(12, 14);
    drawLine(14, 16);
    [12, 14, 16].forEach((index) => {
      const lm = landmarks[index];
      canvasCtx.beginPath();
      canvasCtx.arc(lm.x * 640, lm.y * 480, 7, 0, 2 * Math.PI);
      canvasCtx.fillStyle = "#38b2ac"; // Teal color for joints
      canvasCtx.fill();
      canvasCtx.strokeStyle = "white";
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    });
    canvasCtx.restore();
  };

  // ... All other functions (speak, sendLiveFeedback, handleStartCamera, etc.) and JSX remain unchanged.
  // TTS functionality
  const speak = async (text) => {
    if (!text) return;
    setSpeakingText(`Speaking: "${text}"`);
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": "sk_3c97034de1e49b7a0371bce7c1b08f39fe2305c1fc511479", // Replace with your actual Eleven Labs API key
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setSpeakingText("");
    } catch (error) {
      console.error("TTS error:", error);
      setSpeakingText("TTS failed.");
    }
  };

  // Send live feedback to backend and then speak it
  const sendLiveFeedback = async (poseData) => {
    if (Date.now() - lastFeedbackSent.current < FEEDBACK_INTERVAL) return;

    try {
      const res = await fetch("http://localhost:5000/live-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poseData),
      });
      const data = await res.json();
      const feedbackText = data.feedback || "";

      setFeedback(feedbackText);
      lastFeedbackSent.current = Date.now();
      speak(feedbackText);
    } catch (err) {
      console.error("Error getting live feedback:", err);
      setFeedback("Could not get live feedback.");
      speak("Could not get live feedback.");
    }
  };

  // Camera controls
  const handleStartCamera = () => {
    setIsCameraActive(true);
    setTimer(0);
    setRepCount(0);
    setStage("down");
    setVelocity(0);
    setEnergy(0);
    prevElbowAngleRef.current = null;
    prevTimestampRef.current = null;
    formQualityCounts.current = { poor: 0, fair: 0, good: 0 };
    setFeedback("Get ready to start!");
    setShowReport(false);
    latestPoseData.current = null;
    setSpeakingText("");
  };

  const handleStopCamera = async () => {
    if (camera) camera.stop();
    setIsCameraActive(false);
    setIsPaused(false);
    latestPoseData.current = null;
    setSpeakingText("");

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setSaveError("Authentication required");
      navigate("/login");
      return;
    }

    const totalFrames = formQualityCounts.current.poor + formQualityCounts.current.fair + formQualityCounts.current.good;
    const formScore = totalFrames > 0
      ? ((formQualityCounts.current.good * 100 + formQualityCounts.current.fair * 50) / totalFrames).toFixed(1)
      : 0;

    const sessionData = {
      duration: timer,
      reps: repCount,
      avgTimePerRep: repCount > 0 ? (timer / repCount).toFixed(1) : 0,
      energy: energy.toFixed(1),
      exerciseType: "bicep_curl",
      formScore: formScore,
    };

    setExerciseStats(sessionData);
    setShowReport(true);

    try {
      setIsSaving(true);
      const response = await fetch("http://localhost:8000/exercise/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) throw new Error(await response.text());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
      setFeedback("Session saved.");
    }
  };

  const handlePauseCamera = () => {
    setIsPaused(!isPaused);
    setFeedback(isPaused ? "Resuming..." : "Paused...");
    if (isPaused) {
        setSpeakingText("");
    }
  };

  // Report modal component
  const ReportModal = () => {
    const formScore = parseFloat(exerciseStats.formScore);
    let performanceRating = "Poor";
    if (formScore >= 80) performanceRating = "Excellent";
    else if (formScore >= 60) performanceRating = "Good";
    else if (formScore >= 40) performanceRating = "Fair";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg w-96 shadow-2xl">
          <h2 className="text-3xl font-bold text-[#333333] dark:text-gray-200 mb-6 text-center">
            Exercise Summary
          </h2>
          {isSaving && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">Saving...</div>}
          {isSaved && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">Saved!</div>}
          {saveError && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">Error: {saveError}</div>}
          <div className="space-y-4 mb-6">
            <StatItem label="Duration" value={`${exerciseStats.duration}s`} />
            <StatItem label="Reps Completed" value={exerciseStats.reps} />
            <StatItem label="Avg Time/Rep" value={`${exerciseStats.avgTimePerRep}s`} />
            <StatItem label="Energy Expended" value={`${exerciseStats.energy} J`} />
            <StatItem label="Form Score" value={`${formScore}%`} />
            <StatItem label="Performance" value={performanceRating} />
          </div>
          <button
            onClick={() => setShowReport(false)}
            className="w-full bg-gradient-to-r from-[#6C9BCF] to-[#FF6F61] text-white py-3 rounded-lg hover:opacity-90 transition duration-300"
          >
            Close Report
          </button>
        </div>
      </div>
    );
  };

  const StatItem = ({ label, value }) => (
    <div className="flex justify-between">
      <span className="text-[#555555] dark:text-gray-400">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C9BCF] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A] p-8">
      <h1 className="text-4xl font-bold text-center text-[#333333] dark:text-gray-200 mb-8">
        Mathematical Bicep Curl Coach
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative w-full h-[480px] rounded-lg overflow-hidden shadow-xl bg-black">
          <video ref={videoRef} className="absolute w-full h-full object-cover" playsInline />
          <canvas ref={canvasRef} className="absolute w-full h-full z-20" width="640" height="480" />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-gray-200 mb-4">Live Stats</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatItem label="Timer" value={`${timer}s`} />
              <StatItem label="Reps" value={repCount} />
              <StatItem label="Current Stage" value={stage.toUpperCase()} />
              <StatItem label="Velocity" value={`${velocity} °/s`} />
              <StatItem label="Energy" value={`${energy.toFixed(1)} J`} />
              <StatItem label="Form Quality" value={feedback.includes("❗") ? "POOR" : feedback.includes("⚠️") ? "FAIR" : "GOOD"} />
            </div>
            <div className="p-4 bg-gray-100 dark:bg-neutral-700 rounded-lg">
              <p className="text-center text-[#555555] dark:text-gray-300 font-medium">
                Real-time Feedback: <span className="text-[#FF6F61] dark:text-[#FFD166]">{feedback}</span>
              </p>
              {/* UI for TTS speaking indicator */}
              {speakingText && (
                <div className="mt-2 text-center text-sm text-[#999999] dark:text-gray-500 italic flex items-center justify-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                  🔊 {speakingText}
                </div>
              )}
            </div>
            <div className="mt-6 flex space-x-4 justify-center">
              <ControlButton
                onClick={handleStartCamera}
                disabled={isCameraActive}
                colors="from-[#FF6F61] to-[#FFD166]"
                label="Start"
              />
              <ControlButton
                onClick={handlePauseCamera}
                visible={isCameraActive}
                colors="from-[#FFD166] to-[#6C9BCF]"
                label={isPaused ? "Resume" : "Pause"}
              />
              <ControlButton
                onClick={handleStopCamera}
                visible={isCameraActive || isPaused}
                colors="from-[#6C9BCF] to-[#FF6F61]"
                label="Stop"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-[#333333] dark:text-gray-200 mb-4">Proper Form Tutorial</h2>
            <video controls src={bicep} className="w-full rounded-lg shadow-md aspect-video" />
          </div>
        </div>
      </div>

      {showReport && <ReportModal />}
    </div>
  );
};

const ControlButton = ({ onClick, disabled, visible = true, colors, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r ${colors} text-white px-6 py-2 rounded-lg hover:opacity-90 transition duration-300 ${
      visible ? "inline-block" : "hidden"
    }`}
  >
    {label}
  </button>
);

export default ExercisePose;