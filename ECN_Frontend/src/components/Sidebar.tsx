import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  initials?: string;
  verified: boolean;
  unreadCount?: number;
  color?: string;
  imageUrl?: string;
  role?: string;
  memberCount?: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "#2563eb", "#9333ea", "#16a34a", "#ea580c", 
    "#dc2626", "#0891b2", "#7c3aed", "#059669"
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function Sidebar({ isLoggedIn }: SidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    // First, get current user info
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.student_id) {
          setCurrentUserId(data.student_id);
          // Then fetch their clubs
          return fetch(`/api/students/${data.student_id}/my-clubs`);
        }
        throw new Error("No student ID found");
      })
      .then((res) => res.json())
      .then((clubs) => {
        const formattedClubs = clubs.map((club: any) => ({
          id: club.id,
          name: club.name,
          initials: getInitials(club.name),
          verified: club.verified || false,
          color: getColorFromName(club.name),
          role: club.role,
          memberCount: club.memberCount
        }));
        setUserClubs(formattedClubs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load clubs:", err);
        setLoading(false);
      });
  }, [isLoggedIn]);

  const handleClubClick = (clubId: string) => {
    navigate(`/discover?clubId=${clubId}`);
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
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {!isCollapsed && "Loading clubs..."}
            </div>
          ) : userClubs.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {!isCollapsed && "No clubs joined yet"}
            </div>
          ) : (
            userClubs.map((club) => (
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
                      {club.role && (
                        <p className="text-xs text-gray-500">
                          {club.role}
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
            ))
          )}
        </div>

        {/* Quick Stats */}
        {!isCollapsed && !loading && (
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Total Clubs</span>
              </div>
              <span className="font-semibold">{userClubs.length}</span>
            </div>
          </div>
        )}

        {isCollapsed && !loading && (
          <div className="border-t p-2 flex flex-col items-center space-y-2">
            <div className="text-xs font-semibold text-gray-600" title={`${userClubs.length} clubs`}>
              {userClubs.length}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
