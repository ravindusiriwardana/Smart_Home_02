import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytical from "./pages/Analytical";
import Chatbot from "./pages/Chatbot";

import FloatingNav from "./components/FloatingNav";
import FloatingChatbot from "./components/FloatingChatbot";
import "./App.css";

function App() {
  return (
    <Router>
      {/* Setting a dark background here so it matches the floating nav 
        and the rest of your glassmorphism theme 
      */}
      <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytical" element={<Analytical />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>

        {/* The floating buttons will sit on top of all pages */}
        <FloatingNav />
        <FloatingChatbot />
      </div>
    </Router>
  );
}

export default App;
