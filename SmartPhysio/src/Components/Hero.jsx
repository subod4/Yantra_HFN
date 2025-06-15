import { Link, useNavigate } from "react-router-dom";
import Exercise1 from "../assets/AIExercise.jpg";
import Exercise2 from "../assets/AiExercise2.jpg";

function Hero({ isLoggedIn }) {
  const navigate = useNavigate();

  // Handle navigation to signup
  const handleSignup = () => navigate("/signup");

  // Handle navigation to dashboard
  const handleDashboard = () => navigate("/dashboard");

  return (
    <div className="relative bg-gradient-to-br from-[#6C9BCF] to-[#F4F4F4] dark:from-[#2E4F4F] dark:to-[#1A1A1A] min-h-screen flex flex-col items-center justify-center p-10 pb-40">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(circle_800px_at_50%_50%,rgba(0,0,0,0.1),transparent)] pointer-events-none"></div>

      {/* Content Container */}
      <div className="container mx-auto px-6 text-[#333333] dark:text-gray-200 relative z-10 text-center">
        {/* Text Section */}
        <div className="m-20">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            SajiloRehab{" "}
            <span className="bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-transparent bg-clip-text">
              {isLoggedIn ? "Welcome Back!" : "for Faster Recovery"}
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#555555] dark:text-gray-300">
            {isLoggedIn
              ? "Continue your rehabilitation journey with personalized exercise plans and real-time feedback."
              : "Accelerate your rehabilitation with SajiloRehab’s AI-powered solutions. Get personalized exercise plans, real-time feedback, and track your progress every step of the way. Start your recovery journey with us today!"}
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              // Show "Go to Dashboard" button if user is logged in
              <button
                onClick={handleDashboard}
                className="px-8 py-4 bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white font-medium rounded-full shadow-md hover:shadow-lg transition"
                aria-label="Go to Dashboard"
              >
                Go to Dashboard
              </button>
            ) : (
              // Show "Get Started" and "Learn More" buttons if user is not logged in
              <>
                <button
                  onClick={handleSignup}
                  className="px-8 py-4 bg-gradient-to-r from-[#FF6F61] to-[#FFD166] text-white font-medium rounded-full shadow-md hover:shadow-lg transition"
                  aria-label="Sign up for SmartPhysio"
                >
                  Get Started for Free
                </button>
                <Link
                  to="/about"
                  className="px-8 py-4 bg-transparent border border-[#6C9BCF] dark:border-[#FFD166] text-[#333333] dark:text-gray-200 font-medium rounded-full shadow-md hover:shadow-lg transition hover:border-[#FF6F61] hover:text-[#FF6F61] dark:hover:border-[#FF6F61] dark:hover:text-[#FF6F61]"
                  aria-label="Learn more about SmartPhysio"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Image Section */}
        <div className="flex flex-col sm:flex-row gap-8 mt-12">
          <div className="relative w-full sm:w-1/2">
            <img
              src={Exercise1}
              alt="AI-powered rehabilitation exercises"
              className="rounded-lg border-2 border-[#6C9BCF] shadow-sm shadow-[#6C9BCF] transform hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-4 left-4 bg-white dark:bg-[#2E4F4F] px-4 py-2 rounded-full text-sm font-medium font-sans">
              🏋️‍♂️ AI-Powered Exercises
            </div>
          </div>
          <div className="relative w-full sm:w-1/2">
            <img
              src={Exercise2}
              alt="Tracking progress with SmartPhysio"
              className="rounded-lg border-2 border-[#FFD166] shadow-sm shadow-[#FFD166] transform hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-4 left-4 bg-white dark:bg-[#2E4F4F] px-4 py-2 rounded-full text-sm font-medium font-sans">
              📊 Real-Time Progress Tracking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
