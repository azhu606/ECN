import React from "react";
import { Button } from "./ui/button";
import { Search, Bell, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../authSession";

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Header({ isLoggedIn, setIsLoggedIn }: HeaderProps) {
  const navigate = useNavigate();

  const navItems = [
    { id: "discover", label: "Discover Clubs", path: "/discover" },
    { id: "events", label: "Events", path: "/events" },
    { id: "myClubs", label: "My Clubs", path: "/myclubs" },
    { id: "officers", label: "For Officers", path: "/officers" },
  ];

  const handleLogout = () => {
    clearAuthSession();
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#012169] text-white rounded flex items-center justify-center font-bold">
                E
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">
                  Club Nexus
                </span>
                <div className="text-xs text-gray-500">Emory University</div>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>

            {isLoggedIn ? (
              <Button
                size="sm"
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all font-semibold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/signin")}
                className="bg-[#012169] text-white hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-sm"
              >
                <User className="w-4 h-4 mr-2" />
                NetID Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
