import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { ClubPreview } from "./components/ClubPreview";
import { CallToAction } from "./components/CallToAction";
import { DiscoverClubs } from "./components/DiscoverClubs";
import { Events } from "./components/Events";
import { MyClubs } from "./components/MyClubs";
import { ForOfficers } from "./components/ForOfficers";
import { Footer } from "./components/Footer";
import { AuthProvider } from './context/AuthContext';

type Page = "home" | "discover" | "events" | "myClubs" | "officers";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const renderPage = () => {
    switch (currentPage) {
      case "discover":
        return <DiscoverClubs />;
      case "events":
        return <Events />;
      case "myClubs":
        return <MyClubs />;
      case "officers":
        return <ForOfficers />;
      default:
        return (
          <>
            <Hero />
            <Features />
            <ClubPreview />
            <CallToAction />
          </>
        );
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main>
          {renderPage()}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}