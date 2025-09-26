import { Button } from "./ui/button";
import { Search, Bell, User } from "lucide-react";

type Page = "home" | "discover" | "events" | "myClubs" | "officers";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const navItems = [
    { id: "discover" as const, label: "Discover Clubs" },
    { id: "events" as const, label: "Events" },
    { id: "myClubs" as const, label: "My Clubs" },
    { id: "officers" as const, label: "For Officers" },
  ];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onNavigate("home")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              {/* Emory "E" placeholder - would use real logo */}
              <div className="w-8 h-8 bg-[#012169] text-white rounded flex items-center justify-center font-bold">
                E
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">Club Nexus</span>
                <div className="text-xs text-gray-500">Emory University</div>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`transition-colors ${
                  currentPage === item.id
                    ? "text-[#012169] font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
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
            <Button size="sm">
              <User className="w-4 h-4 mr-2" />
              NetID Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}