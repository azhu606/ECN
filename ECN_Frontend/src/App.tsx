import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { ClubPreview } from "./components/ClubPreview";
import { CallToAction } from "./components/CallToAction";
import { DiscoverClubs } from "./components/DiscoverClubs";
import { Events } from "./components/Events";
import { MyClubs } from "./components/MyClubs";
import { ForOfficers } from "./components/ForOfficers";
import SignIn from "./pages/SignIn";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  // Temporary state: default to true until changes are done
  // TODOL revert to false after implementing officer features
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-white">
        <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Hero />
                  <Features />
                  <ClubPreview />
                  <CallToAction />
                </>
              }
            />
            <Route path="/discover" element={<DiscoverClubs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/myclubs" element={<MyClubs isLoggedIn={isLoggedIn} />} />
            <Route path="/officers" element={<ForOfficers isLoggedIn={isLoggedIn} />} />
            <Route
              path="/signin"
              element={<SignIn setIsLoggedIn={setIsLoggedIn} />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

