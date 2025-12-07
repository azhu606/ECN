import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { 
  Users, 
  Calendar, 
  Bell, 
  Settings,
  Star,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Heart,
  MessageSquare,
  Lock,
  ShieldAlert
} from "lucide-react";
import React from "react";
import { useAuth } from "../context/AuthContext";
interface UserClub {
  id: string;
  name: string;
  role: "Member" | "Officer" | "President";
  joinDate: string;
  category: string;
  verified: boolean;
  lastActivity: string;
  memberCount: number;
  engagement: number;
  nextEvent?: {
    name: string;
    date: string;
    time: string;
  };
  recentActivity: {
    type: "event" | "announcement" | "update";
    title: string;
    time: string;
  }[];
}

interface Notification {
  id: string;
  club: string;
  type: "event" | "announcement" | "reminder";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const userClubs: UserClub[] = [
  {
    id: "1",
    name: "Pre-Medical Society",
    role: "Officer",
    joinDate: "2023-09-15",
    category: "Academic",
    verified: true,
    lastActivity: "2 hours ago",
    memberCount: 180,
    engagement: 85,
    nextEvent: {
      name: "Medical School Panel",
      date: "Oct 20",
      time: "7:00 PM"
    },
    recentActivity: [
      { type: "event", title: "MCAT Study Group scheduled", time: "3 hours ago" },
      { type: "announcement", title: "Research opportunities posted", time: "1 day ago" }
    ]
  },
  {
    id: "2",
    name: "Computer Science Society",
    role: "Member",
    joinDate: "2023-08-28",
    category: "Academic",
    verified: true,
    lastActivity: "5 hours ago",
    memberCount: 200,
    engagement: 72,
    nextEvent: {
      name: "Google Tech Talk",
      date: "Oct 21",
      time: "5:30 PM"
    },
    recentActivity: [
      { type: "event", title: "Hackathon registration opens", time: "6 hours ago" },
      { type: "update", title: "New job postings available", time: "2 days ago" }
    ]
  },
  {
    id: "3",
    name: "Sustainability Action Network",
    role: "Member",
    joinDate: "2024-01-20",
    category: "Environmental",
    verified: true,
    lastActivity: "1 day ago",
    memberCount: 95,
    engagement: 68,
    nextEvent: {
      name: "Campus Composting Workshop",
      date: "Oct 23",
      time: "3:00 PM"
    },
    recentActivity: [
      { type: "announcement", title: "Earth Week planning meeting", time: "1 day ago" },
      { type: "event", title: "Recycling drive scheduled", time: "3 days ago" }
    ]
  }
];

const notifications: Notification[] = [
  {
    id: "1",
    club: "Pre-Medical Society",
    type: "reminder",
    title: "Meeting Tomorrow",
    message: "Don't forget about the executive board meeting tomorrow at 6 PM in the Chemistry Building.",
    time: "2 hours ago",
    read: false
  },
  {
    id: "2",
    club: "Computer Science Society",
    type: "event",
    title: "New Event: Google Tech Talk",
    message: "A Google engineer will be speaking about AI applications in healthcare. RSVP now!",
    time: "5 hours ago",
    read: false
  },
  {
    id: "3",
    club: "Sustainability Action Network",
    type: "announcement",
    title: "Volunteer Opportunity",
    message: "Help us plant trees on campus this Saturday. Sign up link in the club portal.",
    time: "1 day ago",
    read: true
  }
];

export function MyClubs() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();   // 👈 pull from AuthContext
  const [unreadCount] = useState(
    notifications.filter((n) => !n.read).length
  );

  // TEMP: show UUID here too if you want to verify
  console.log("USER FROM AUTH (MyClubs):", user);

  // If not logged in, show authentication prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            {/* ... your existing not-logged-in UI unchanged ... */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // rest of your existing MyClubs JSX stays the same
  return (
    <div className="min-h-screen bg-gray-50">
      {/* optional debug display */}
      <p className="px-4 pt-4 text-xs text-red-600 font-mono">
        Logged-in UUID: {user?.id}
      </p>

      {/* Header */}
      {/* ...everything you already have below unchanged... */}
    </div>
  );
}



