import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as Tabs from "@radix-ui/react-tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const severityColors = {
  Mild: "bg-green-100 text-green-700",
  Moderate: "bg-yellow-100 text-yellow-700",
  Severe: "bg-red-100 text-red-700",
};

const palette = {
  bg: "bg-white dark:bg-neutral-800",
  border: "border-gray-200 dark:border-neutral-700",
  text: "text-[#333333] dark:text-gray-200",
  subtext: "text-[#555555] dark:text-gray-400",
  accent: "from-[#FF6F61] to-[#FFD166]",
  tableHeader:
    "bg-gradient-to-r from-[#FF6F61]/10 to-[#FFD166]/10 dark:from-[#2E4F4F]/60 dark:to-[#1A1A1A]/60",
  tableRow: "hover:bg-[#FFF7ED] dark:hover:bg-[#2E4F4F]/40",
  chartBg: "#f4f4f4",
  chartBgDark: "#23272e",
  chartGrid: "#FFD166",
  chartGridDark: "#2E4F4F",
  chartLine: "#FF6F61",
  chartText: "#333333",
  chartTextDark: "#F4F4F4",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [exerciseSessions, setExerciseSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("recommendations");
  const [expandedRec, setExpandedRec] = useState(null);

  // Detect dark mode for chart theme
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(match.matches);
    const handler = (e) => setIsDark(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          navigate("/signin");
          return;
        }

        const recResponse = await fetch(
          "http://localhost:8000/recommendations",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!recResponse.ok) {
          const errorData = await recResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch recommendations"
          );
        }

        const recResult = await recResponse.json();
        if (!recResult.success || !Array.isArray(recResult.recommendations)) {
          throw new Error(recResult.message || "Invalid recommendations data");
        }

        setRecommendations(recResult.recommendations);

        const sessResponse = await fetch(
          "http://localhost:8000/exercise/sessions",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!sessResponse.ok) {
          const errorData = await sessResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch exercise sessions"
          );
        }

        const sessResult = await sessResponse.json();
        setExerciseSessions(sessResult.data || sessResult.sessions || []);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const deleteRecommendation = async (recId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `http://localhost:8000/recommendations/${recId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete recommendation");
      }

      setRecommendations(recommendations.filter((rec) => rec._id !== recId));
    } catch (err) {
      console.error("Delete Recommendation Error:", err);
      setError(err.message);
    }
  };

  const deleteExerciseSession = async (sessionId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `http://localhost:8000/exercise/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete exercise session");
      }

      setExerciseSessions(
        exerciseSessions.filter((session) => session._id !== sessionId)
      );
    } catch (err) {
      console.error("Delete Session Error:", err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getPerformanceColor = (formScore) => {
    if (formScore >= 80) return "text-green-600";
    if (formScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceLabel = (formScore) => {
    if (formScore >= 80) return "Excellent";
    if (formScore >= 60) return "Good";
    if (formScore >= 40) return "Fair";
    return "Poor";
  };

  // Severity badge
  const SeverityBadge = ({ severity }) => (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        severityColors[severity] || "bg-gray-100 text-gray-700"
      }`}
    >
      {severity || "N/A"}
    </span>
  );

  // Line graph for reps
  const ExerciseRepsLineGraph = ({ sessions }) => {
    if (!sessions.length) return null;
    // Sort by timestamp ascending for graph
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    const data = sorted.map((session, idx) => ({
      name: session.exerciseType
        ? session.exerciseType.replace(/_/g, " ")
        : `Session ${idx + 1}`,
      reps: session.reps || 0,
      date: new Date(session.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

    // Theme colors
    const chartBg = isDark ? palette.chartBgDark : palette.chartBg;
    const chartGrid = isDark ? palette.chartGridDark : palette.chartGrid;
    const chartText = isDark ? palette.chartTextDark : palette.chartText;

    return (
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-[#333333] dark:text-gray-200">
          Progress Over Time
        </h3>
        <div
          className={`w-full h-64 rounded-xl shadow p-4`}
          style={{
            background: chartBg,
            transition: "background 0.3s",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: chartText }} />
              <YAxis allowDecimals={false} tick={{ fill: chartText }} />
              <Tooltip
                contentStyle={{
                  background: chartBg,
                  border: `1px solid ${chartGrid}`,
                  color: chartText,
                }}
                labelStyle={{ color: chartText }}
                itemStyle={{ color: chartText }}
              />
              <Line
                type="monotone"
                dataKey="reps"
                stroke={palette.chartLine}
                strokeWidth={3}
                dot={{ r: 5, fill: palette.chartLine }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C9BCF] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-[#333333] dark:text-gray-200 mb-8 mt-16 bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-transparent bg-clip-text">
          Your SajiloRehab Dashboard
        </h1>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List className="flex justify-center mb-8 gap-4">
            <Tabs.Trigger
              value="recommendations"
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                tab === "recommendations"
                  ? "bg-[#FF6F61] text-white"
                  : "bg-gray-200 dark:bg-neutral-700 text-[#333]"
              }`}
            >
              Recommendations
            </Tabs.Trigger>
            <Tabs.Trigger
              value="history"
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                tab === "history"
                  ? "bg-[#FFD166] text-[#333]"
                  : "bg-gray-200 dark:bg-neutral-700 text-[#333]"
              }`}
            >
              Exercise History
            </Tabs.Trigger>
          </Tabs.List>

          {loading && (
            <div className="text-center text-[#555555] dark:text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6F61] border-t-transparent mx-auto"></div>
              <p className="mt-4">Loading your data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-lg mb-6 text-center">
              ⚠️ {error}
            </div>
          )}

          <Tabs.Content value="recommendations">
            {!loading && !error && (
              <section className="mb-12">
                {recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((recommendation, index) => (
                      <motion.div
                        key={recommendation._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 relative"
                      >
                        <button
                          onClick={() =>
                            deleteRecommendation(recommendation._id)
                          }
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                          title="Remove recommendation"
                        >
                          ✕
                        </button>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-transparent bg-clip-text">
                            {recommendation.injuryType.toUpperCase()}
                          </h3>
                          <span className="text-sm text-[#555555] dark:text-gray-400">
                            {formatDate(recommendation.acceptanceDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <SeverityBadge severity={recommendation.severity} />
                        </div>
                        <div className="space-y-3 mb-4">
                          <StatItem
                            label="Duration"
                            value={recommendation.duration || "N/A"}
                          />
                          <StatItem
                            label="Details"
                            value={
                              recommendation.details
                                ? recommendation.details.slice(0, 50) +
                                  (recommendation.details.length > 50
                                    ? "..."
                                    : "")
                                : "N/A"
                            }
                          />
                        </div>
                        <button
                          className="w-full text-sm text-[#6C9BCF] dark:text-[#FFD166] hover:underline mb-2"
                          onClick={() =>
                            setExpandedRec(expandedRec === index ? null : index)
                          }
                        >
                          {expandedRec === index
                            ? "Hide Exercises"
                            : "Show Exercises"}
                        </button>
                        <AnimatePresence>
                          {expandedRec === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-semibold text-[#333333] dark:text-gray-200 mb-2">
                                  Recommended Exercises
                                </h4>
                                <div className="space-y-2">
                                  {recommendation.exercises &&
                                  recommendation.exercises.length > 0 ? (
                                    recommendation.exercises.map(
                                      (exercise, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-neutral-700 rounded-lg"
                                        >
                                          <div className="p-1 bg-[#FF6F61] rounded-full">
                                            <span className="text-white text-sm">
                                              🏥
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-[#333333] dark:text-gray-200 font-medium">
                                              {exercise.name || "Unnamed"}
                                            </p>
                                            <p className="text-sm text-[#555555] dark:text-gray-400">
                                              {exercise.description
                                                ? exercise.description.slice(
                                                    0,
                                                    30
                                                  ) +
                                                  (exercise.description.length >
                                                  30
                                                    ? "..."
                                                    : "")
                                                : "No description"}
                                            </p>
                                            <p className="text-sm text-[#6C9BCF] dark:text-[#6C9BCF]">
                                              {exercise.duration || "N/A"} |{" "}
                                              {exercise.frequency || "N/A"}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <p className="text-sm text-[#555555] dark:text-gray-400">
                                      No exercises available
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#555555] dark:text-gray-400 py-6">
                    <p>
                      No recommendations yet. Start with the{" "}
                      <button
                        onClick={() => navigate("/chat")}
                        className="text-[#FF6F61] dark:text-[#FFD166] hover:underline"
                      >
                        SmartPhysio AI Advisor
                      </button>
                      .
                    </p>
                  </div>
                )}
              </section>
            )}
          </Tabs.Content>

          <Tabs.Content value="history">
            {!loading && !error && (
              <section>
                <ExerciseRepsLineGraph sessions={exerciseSessions} />
                {exerciseSessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table
                      className={`min-w-full divide-y ${palette.border} ${palette.bg} rounded-xl shadow`}
                    >
                      <thead>
                        <tr className={palette.tableHeader}>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Exercise Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Total Reps
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Avg Time/Rep
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Energy
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Form Score
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#333333] dark:text-gray-200 uppercase">
                            Performance
                          </th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exerciseSessions.map((session, index) => (
                          <tr
                            key={session._id || index}
                            className={`${palette.tableRow} bg-white dark:bg-neutral-800`}
                          >
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {formatDate(session.timestamp)}
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.exerciseType
                                ?.replace(/_/g, " ")
                                .toUpperCase() || "Unnamed Session"}
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.duration || 0}s
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.reps || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.avgTimePerRep || 0}s
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.energy || 0} J
                            </td>
                            <td className="px-4 py-3 text-[#333] dark:text-gray-200">
                              {session.formScore || 0}%
                            </td>
                            <td
                              className={`px-4 py-3 font-bold ${getPerformanceColor(
                                session.formScore || 0
                              )}`}
                            >
                              {getPerformanceLabel(session.formScore || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  deleteExerciseSession(session._id)
                                }
                                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                                title="Remove session"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-[#555555] dark:text-gray-400 py-6">
                    <p>No exercise sessions recorded yet.</p>
                  </div>
                )}
              </section>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

const StatItem = ({
  label,
  value,
  className = "text-[#333333] dark:text-gray-200",
}) => (
  <div className="flex justify-between items-center">
    <span className="text-[#555555] dark:text-gray-400">{label}:</span>
    <span className={`font-semibold ${className}`}>{value}</span>
  </div>
);

export default Dashboard;
