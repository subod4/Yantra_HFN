import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdInfo, MdPlayCircle } from "react-icons/md";

const exercises = {
  "Push-ups":
    "An exercise to strengthen the upper body, particularly the chest and triceps.",
  Squats: "A lower body exercise that targets the thighs, hips, and buttocks.",
  Lunges: "An exercise focusing on the legs, enhancing strength and balance.",
  Plank:
    "A core-strengthening exercise that also works the shoulders and back.",
  Bridges: "Targets the glutes and lower back while improving core stability.",
  Clamshells: "Strengthens the hip muscles and improves hip stability.",
  "Bird Dogs":
    "Enhances balance and coordination while working on core stability.",
  "Dead Bugs":
    "Strengthens the core while focusing on coordination between limbs.",
  "Shoulder Press": "An exercise to build shoulder and upper arm strength.",
  "Bicep Curls": "Strengthens the biceps and improves arm aesthetics.",
  "Tricep Dips":
    "Targets the triceps, helping to tone and strengthen the arms.",
  "Calf Raises": "Focuses on strengthening the calf muscles.",
  "Seated Row": "Targets the back muscles, improving posture and strength.",
  "Wall Angels": "Improves shoulder mobility and posture.",
  "Chest Stretch": "A flexibility exercise for the chest and shoulders.",
  "Hamstring Stretch":
    "Stretches the hamstring muscles to enhance flexibility.",
  "Quadriceps Stretch": "Stretches the quadriceps for improved flexibility.",
  "Hip Flexor Stretch": "Stretches the hip flexors to improve range of motion.",
  "Spinal Twist": "Enhances spinal mobility and flexibility.",
  "Side Lunges": "Strengthens the inner thighs and improves balance.",
  "Glute Bridges": "Focuses on the glutes and lower back for better stability.",
  "Mountain Climbers":
    "A full-body exercise that increases heart rate and builds endurance.",
  "Leg Raises": "Strengthens the lower abdominal muscles.",
  "Standing Balance": "Improves balance and stability through weight shifting.",
  "Side Plank": "Strengthens the oblique muscles and stabilizes the core.",
  "Torso Rotation": "Enhances core flexibility and stability.",
  "Wrist Flexor Stretch": "Stretches the wrist and forearm muscles.",
  "Ankle Circles": "Improves ankle mobility and flexibility.",
  "T-Pose Exercise": "Strengthens the upper back and shoulders.",
  "Knee to Chest Stretch": "Stretches the lower back and glutes.",
  "Pigeon Pose": "A yoga pose that stretches the hips and glutes.",
};

const categories = {
  All: Object.keys(exercises),
  Strength: ["Push-ups", "Squats", "Lunges", "Plank"],
  Flexibility: ["Hamstring Stretch", "Spinal Twist", "Pigeon Pose"],
};

const Exercise = () => {
  const { exerciseName } = useParams();
  const [open, setOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleInfoClick = (exercise) => {
    setSelectedExercise(exercise);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExercise(null);
  };

  const handleExerciseClick = (exerciseName) => {
    const formattedName = exerciseName.toLowerCase().replace(/\s+/g, "-");
    navigate(`/exercise/${formattedName}`);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredExercises = categories[category].filter((exercise) =>
    exercise.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If exerciseName is present, render the exercise details
  if (exerciseName) {
    const formattedExerciseName = exerciseName.replace(/-/g, " ");
    const exercise = exercises[formattedExerciseName];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6C9BCF] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A] py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white/90 dark:bg-neutral-900/90 rounded-3xl shadow-2xl border border-[#6C9BCF]/20 dark:border-[#FFD166]/20 p-10 mt-20">
            <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-[#FF6F61] to-[#FFD166] bg-clip-text text-transparent mb-6">
              {formattedExerciseName}
            </h1>
            <p className="text-center text-lg text-[#555555] dark:text-gray-300">
              {exercise}
            </p>
            <div className="flex justify-center mt-10">
              <button
                onClick={() => navigate("/exercise")}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white font-semibold shadow hover:opacity-90 transition"
              >
                Back to All Exercises
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the exercise list
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C9BCF] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-[#FF6F61] to-[#FFD166] bg-clip-text text-transparent mt-20 mb-10 drop-shadow">
          SajiloRehab Exercise Guide
        </h1>

        {/* Filter and Search Section - 9anime-inspired modern UI */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
          {/* Search Bar */}
          <div className="flex-1 flex items-center bg-white/80 dark:bg-neutral-800/80 rounded-full shadow-lg border border-[#6C9BCF] dark:border-[#FFD166] px-4 py-2 focus-within:ring-2 focus-within:ring-[#FF6F61] transition">
            <svg
              className="w-5 h-5 text-[#6C9BCF] dark:text-[#FFD166] mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search"
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent outline-none text-[#333333] dark:text-gray-200 placeholder:text-[#6C9BCF] dark:placeholder:text-[#FFD166] text-base"
            />
          </div>
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#333333] dark:text-gray-200">
              Category:
            </span>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={handleCategoryChange}
                className="appearance-none bg-white/80 dark:bg-neutral-800/80 border border-[#6C9BCF] dark:border-[#FFD166] rounded-full px-5 py-2 pr-10 text-[#333333] dark:text-gray-200 shadow focus:ring-2 focus:ring-[#FF6F61] transition"
              >
                <option value="All">All</option>
                <option value="Strength">Strength</option>
                <option value="Flexibility">Flexibility</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6C9BCF] dark:text-[#FFD166]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Exercise Cards - Themed, modern, and visually appealing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredExercises.map((exercise, index) => (
            <div
              key={index}
              className="group cursor-pointer bg-gradient-to-br from-[#F4F4F4] to-[#EAF6FF] dark:from-[#22313C] dark:to-[#1A1A1A] rounded-3xl shadow-xl border border-[#6C9BCF]/20 dark:border-[#FFD166]/20 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.03]"
              onClick={() => handleExerciseClick(exercise)}
            >
              <div className="p-8 flex flex-col h-full justify-between">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#FF6F61] to-[#FFD166] bg-clip-text text-transparent mb-2 group-hover:from-[#FFD166] group-hover:to-[#FF6F61] transition-colors">
                  {exercise}
                </h2>
                <p className="mt-2 text-base text-[#555555] dark:text-gray-300 min-h-[56px]">
                  {exercises[exercise]}
                </p>
                <div className="flex justify-center mt-8 space-x-6">
                  <button
                    aria-label="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInfoClick({
                        name: exercise,
                        description: exercises[exercise],
                      });
                    }}
                    className="transition-colors rounded-full p-3 bg-white dark:bg-neutral-800 border border-[#6C9BCF]/30 dark:border-[#FFD166]/30 shadow hover:bg-[#FF6F61]/10 hover:scale-110"
                  >
                    <MdInfo className="w-7 h-7 text-[#FF6F61] group-hover:text-[#FFD166] transition-colors" />
                  </button>
                  <button
                    aria-label="youtube"
                    onClick={() => handleExerciseClick(exercise)}
                    className="transition-colors rounded-full p-3 bg-white dark:bg-neutral-800 border border-[#FFD166]/30 dark:border-[#FF6F61]/30 shadow hover:bg-[#FFD166]/10 hover:scale-110"
                  >
                    <MdPlayCircle className="w-7 h-7 text-[#FFD166] group-hover:text-[#FF6F61] transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Modal for Exercise Description */}
        {open && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-100 dark:border-neutral-700">
              <h2 className="text-2xl font-bold text-[#333333] dark:text-gray-100 mb-4">
                {selectedExercise?.name} - Description
              </h2>
              <p className="text-lg text-[#555555] dark:text-gray-300">
                {selectedExercise?.description}
              </p>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white font-semibold shadow hover:opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercise;
