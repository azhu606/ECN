import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Sidebar } from "./components/Sidebar";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { ClubPreview } from "./components/ClubPreview";
import { CallToAction } from "./components/CallToAction";

import { DiscoverClubs } from "./components/DiscoverClubs";
import { Events } from "./components/Events";
import { MyClubs } from "./components/MyClubs";
import { ForOfficers } from "./components/ForOfficers";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Verification from "./pages/Verification";

import { AuthProvider, useAuth } from "./context/AuthContext";

/* ---------------------- Protected Route Wrapper ---------------------- */

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

/* ------------------------------ AppInner ------------------------------ */

function AppInner() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <Header isLoggedIn={isLoggedIn} logout={logout} />

      {/* Layout: Sidebar + Main */}
      <div className="flex flex-1">
        <Sidebar isLoggedIn={isLoggedIn} />

        <main className="flex-1">
          <Routes>
            {/* Public Landing Page */}
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

            {/* Auth Pages */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify" element={<Verification />} />

            {/* Protected Routes */}
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <DiscoverClubs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />

            <Route
              path="/myclubs"
              element={
                <ProtectedRoute>
                  <MyClubs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/officers"
              element={
                <ProtectedRoute>
                  <ForOfficers />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ------------------------------- App Root ------------------------------- */

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
