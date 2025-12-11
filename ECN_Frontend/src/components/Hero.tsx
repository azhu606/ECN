import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Users, Calendar, Shield } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

export function Hero() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate("/discover");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Find Your Community at{" "}
                <span className="text-[#012169]">Emory</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover clubs, connect with verified contacts, and never miss an event. 
                ECN makes it effortless to find your people and build lasting connections.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-lg shadow-lg max-w-md">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <Input 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search clubs, events, interests..." 
                  className="border-0 focus-visible:ring-0 bg-transparent"
                />
                <Button size="sm" onClick={() => navigate("/discover")}>
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Stats - Now Clickable */}
            <div className="flex items-center space-x-8 pt-4">
              <button 
                onClick={() => navigate("/discover")}
                className="flex items-center space-x-2 hover:text-[#012169] transition-colors"
              >
                <Users className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600 hover:text-[#012169]">500+ Active Clubs</span>
              </button>
              <button 
                onClick={() => navigate("/events")}
                className="flex items-center space-x-2 hover:text-[#012169] transition-colors"
              >
                <Calendar className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600 hover:text-[#012169]">Live Events Feed</span>
              </button>
              <button 
                onClick={() => navigate("/discover?verified=true")}
                className="flex items-center space-x-2 hover:text-[#012169] transition-colors"
              >
                <Shield className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600 hover:text-[#012169]">Verified Contacts</span>
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-[#012169] hover:bg-[#001a5c]"
                onClick={() => navigate("/discover")}
              >
                Browse Clubs
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/events")}
              >
                Upcoming Events
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://www.emory.edu/home/_includes/images/sections/help/9.2/_0001_0110302-09bm-f029-maps.jpg"
                alt="Emory University campus"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Elements - Now Clickable */}
            <button 
              onClick={() => navigate("/events")}
              className="absolute -top-4 -right-4 bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="text-sm font-semibold text-gray-900">📅 This Week</div>
              <div className="text-xs text-gray-600">25 Events</div>
            </button>
            <button 
              onClick={() => navigate("/discover")}
              className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="text-sm font-semibold text-gray-900">🎯 Perfect Match</div>
              <div className="text-xs text-gray-600">Based on your interests</div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
