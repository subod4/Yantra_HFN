import * as React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import Hero from "./Components/Hero.jsx";
import Features from "./Components/Features.jsx";
import Pricing from "./Components/Pricing.jsx";
import Footer from "./Components/Footer.jsx";
import About from "./Components/About.jsx";
import SignIn from "./Components/Signin.jsx";
import SignUp from "./Components/Signup.jsx";
import Exercise from "./Components/Exercise.jsx";
import Chat from "./Components/Chat.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import Bicep from "./Exercises/Bicepcurl.jsx";
import ChatApp from "./Components/ChatApp.jsx"; // Import ChatApp

// Create a Home component that includes Hero, Features, and Pricing
function Home({ isLoggedIn }) {
  return (
    <div>
      <Hero isLoggedIn={isLoggedIn} />
      <Features />
      <Pricing />
    </div>
  );
}

// Helper to use location outside Router
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Check if on bicep curl page
  const isBicepPage = location.pathname === "/exercise/bicep-curls";

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/signin"
          element={<SignIn setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/exercise" element={<Exercise />}>
          <Route path=":exerciseName" element={<Exercise />} />
        </Route>
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Pass prop to Bicep to show ChatApp expanded */}
        <Route
          path="/exercise/bicep-curls"
          element={
            <Bicep
              showChatApp
              sessionCode="6eb8d5dd-3a3f-4ae8-937f-6870427ee267"
            />
          }
        />
      </Routes>
      {/* Show ChatApp as floating widget on all pages except bicep curl */}
      {!isBicepPage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
          }}
        >
          <ChatApp sessionCode="0304e840-b0bd-4b9d-a660-f5b5db9a5021" />
        </div>
      )}
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
