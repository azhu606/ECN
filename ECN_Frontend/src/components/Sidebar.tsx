import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Calendar,
  Bell
} from "lucide-react";

interface SidebarProps {
  isLoggedIn: boolean;
}

interface Club {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  unreadCount?: number;
  color: string;
  imageUrl?: string;
}

// Mock data
const userClubs: Club[] = [
  {
    id: "1",
    name: "Pre-Medical Society",
    initials: "PM",
    verified: true,
    unreadCount: 3,
    color: "#2563eb"
  },
  {
    id: "2",
    name: "Computer Science Society",
    initials: "CS",
    verified: true,
    unreadCount: 1,
    color: "#9333ea"
  },
  {
    id: "3",
    name: "Sustainability Action Network",
    initials: "SAN",
    verified: true,
    unreadCount: 2,
    color: "#16a34a"
  },
  {
    id: "4",
    name: "Business Analytics Club",
    initials: "BAC",
    verified: false,
    unreadCount: 5,
    color: "#ea580c",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop"
  }
];

export function Sidebar({ isLoggedIn }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleClubClick = (clubId: string) => {
    console.log(`Navigating to club ${clubId}`);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <aside
      className={`
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex items-center justify-between p-3 border-b">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-gray-900">My Clubs</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Clubs List */}
        <div className="flex-1 overflow-y-auto p-2">
          {userClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => handleClubClick(club.id)}
              className={`
                w-full flex items-center p-2 rounded-lg hover:bg-gray-100 
                transition-colors mb-1 relative group
                ${isCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={isCollapsed ? club.name : undefined}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-9 h-9">
                  <AvatarFallback 
                    className="text-white text-xs font-semibold"
                    style={{ backgroundColor: club.color }}
                  >
                    {club.initials}
                  </AvatarFallback>
                </Avatar>
                {club.unreadCount && club.unreadCount > 0 && isCollapsed && (
                  <span 
                    className="absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {club.unreadCount}
                  </span>
                )}
              </div>
              
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {club.name}
                      </p>
                      {club.verified && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    {club.unreadCount && club.unreadCount > 0 && (
                      <p className="text-xs text-gray-500">
                        {club.unreadCount} new
                      </p>
                    )}
                  </div>
                  {club.unreadCount && club.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 h-5">
                      {club.unreadCount}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Total Clubs</span>
              </div>
              <span className="font-semibold">{userClubs.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Bell className="w-3.5 h-3.5" />
                <span>Notifications</span>
              </div>
              <span className="font-semibold text-red-500">
                {userClubs.reduce((sum, club) => sum + (club.unreadCount || 0), 0)}
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="border-t p-2 flex flex-col items-center space-y-2">
            <div className="text-xs font-semibold text-gray-600" title={`${userClubs.length} clubs`}>
              {userClubs.length}
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full" 
                 title={`${userClubs.reduce((sum, club) => sum + (club.unreadCount || 0), 0)} notifications`}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
