import { useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  Heart,
  MessageSquare,
  Lock,
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw,
  LogOut,
  X,
} from "lucide-react";
import { getCurrentUserId } from "../authSession";

// ============================================================
// API CONFIGURATION & TYPES
// ============================================================

const API_BASE = "/api"; // Adjust if your API has a different base URL

// Types
interface ClubNextEvent {
  id: string;
  name: string;
  date: string;
  time: string;
}

interface ClubActivity {
  type: "event" | "announcement" | "update";
  title: string;
  time: string;
}

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
  nextEvent?: ClubNextEvent;
  recentActivity: ClubActivity[];
}

interface UpcomingEvent {
  id: string;
  name: string;
  description?: string;
  clubId: string;
  clubName: string;
  date: string;
  time: string;
  startTime: string;
  location?: string;
  capacity?: number;
  registered: number;
  isRsvped: boolean;
}

interface UserStats {
  clubsJoined: number;
  upcomingEvents: number;
  leadershipRoles: number;
  avgEngagement: number;
}

interface RecentActivity {
  id: string;
  type: "event" | "announcement" | "update";
  title: string;
  clubId: string;
  clubName: string;
  time: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Fetch all clubs the user has joined
 */
async function fetchMyClubs(userId: string): Promise<UserClub[]> {
  const response = await fetch(`${API_BASE}/students/${userId}/my-clubs`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch clubs");
  }

  return response.json();
}

/**
 * Fetch upcoming events from user's clubs
 */
async function fetchUpcomingEvents(userId: string): Promise<UpcomingEvent[]> {
  const response = await fetch(`${API_BASE}/students/${userId}/upcoming-events`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch events");
  }

  return response.json();
}

/**
 * Fetch user stats (clubs joined, upcoming events, leadership roles, etc.)
 */
async function fetchUserStats(userId: string): Promise<UserStats> {
  const response = await fetch(`${API_BASE}/students/${userId}/stats`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch stats");
  }

  return response.json();
}

/**
 * Fetch recent activity across user's clubs
 */
async function fetchRecentActivity(userId: string): Promise<RecentActivity[]> {
  const response = await fetch(`${API_BASE}/students/${userId}/recent-activity`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch activity");
  }

  return response.json();
}

/**
 * Leave a club
 */
async function leaveClub(
  clubId: string,
  userId: string
): Promise<{ left: boolean; memberCount: number }> {
  const response = await fetch(`${API_BASE}/clubs/${clubId}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || "Failed to leave club");
  }

  return response.json();
}

/**
 * RSVP to an event (toggle)
 */
async function toggleEventRsvp(
  eventId: string,
  userId: string
): Promise<{ rsvped: boolean; registered: number }> {
  const response = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || "Failed to update RSVP");
  }

  return response.json();
}

// ============================================================
// COMPONENT
// ============================================================

interface MyClubsProps {
  isLoggedIn: boolean;
}

export function MyClubs({ isLoggedIn }: MyClubsProps) {
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  // State for API data
  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Selected club for detailed view
  const [selectedClub, setSelectedClub] = useState<UserClub | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all data
  const loadData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [clubsData, eventsData, statsData, activityData] = await Promise.all([
        fetchMyClubs(userId),
        fetchUpcomingEvents(userId),
        fetchUserStats(userId),
        fetchRecentActivity(userId),
      ]);

      setUserClubs(clubsData);
      setUpcomingEvents(eventsData);
      setUserStats(statsData);
      setRecentActivity(activityData);
    } catch (err) {
      console.error("Failed to load My Clubs data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load data on mount
  useEffect(() => {
    if (isLoggedIn && userId) {
      loadData();
    }
  }, [isLoggedIn, userId, loadData]);

  // Handle leaving a club
  const handleLeaveClub = async (clubId: string, clubName: string) => {
    if (!userId) return;

    const confirmed = window.confirm(
      `Are you sure you want to leave "${clubName}"? You can rejoin later from the Discover page.`
    );

    if (!confirmed) return;

    setActionLoading(clubId);
    try {
      await leaveClub(clubId, userId);
      // Remove club from local state
      setUserClubs((prev) => prev.filter((c) => c.id !== clubId));
      // Update stats
      if (userStats) {
        setUserStats({
          ...userStats,
          clubsJoined: userStats.clubsJoined - 1,
        });
      }
    } catch (err) {
      console.error("Failed to leave club:", err);
      alert(err instanceof Error ? err.message : "Failed to leave club");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle viewing club details
  const handleViewDetails = (club: UserClub) => {
    if (selectedClub?.id === club.id) {
      // If already selected, close the details
      setSelectedClub(null);
    } else {
      setSelectedClub(club);
      // Scroll to details view
      setTimeout(() => {
        const el = document.getElementById(`club-details-${club.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // Handle RSVP toggle
  const handleRsvpToggle = async (eventId: string) => {
    if (!userId) return;

    setActionLoading(eventId);
    try {
      const result = await toggleEventRsvp(eventId, userId);
      // Update local state
      setUpcomingEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, isRsvped: result.rsvped, registered: result.registered }
            : e
        )
      );
    } catch (err) {
      console.error("Failed to toggle RSVP:", err);
      alert(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setActionLoading(null);
    }
  };

  // If not logged in, show authentication prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#012169] rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Sign In to View Your Clubs
              </h2>
              <p className="text-gray-600">
                Access your personalized club dashboard, track events, and stay
                connected with your communities.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-left text-blue-900">
                  <p className="font-semibold">My Clubs Features:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• View all your joined clubs in one place</li>
                    <li>• Get notifications about upcoming events</li>
                    <li>• Track your engagement and activity</li>
                    <li>• Manage your club memberships</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => navigate("/signin")}
                className="w-full bg-[#012169] hover:bg-[#0a2e6e] text-white h-11 text-base font-semibold"
              >
                Sign In with NetID
              </Button>

              <Button
                onClick={() => navigate("/discover")}
                variant="outline"
                className="w-full h-11 text-base"
              >
                Browse Clubs as Guest
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              New to ECN? Sign in with your Emory NetID to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#012169] mx-auto" />
          <p className="text-gray-600">Loading your clubs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              Failed to Load
            </h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "President":
        return "bg-purple-100 text-purple-800";
      case "Officer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "announcement":
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "update":
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Clubs</h1>
              <p className="text-gray-600 mt-2">
                Manage your club memberships and stay updated
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#012169]">
                  {userStats?.clubsJoined ?? userClubs.length}
                </div>
                <div className="text-sm text-gray-500">Active Memberships</div>
              </div>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clubs">
              My Clubs ({userClubs.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Events ({upcomingEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#012169]" />
                    <div>
                      <div className="text-2xl font-bold">
                        {userStats?.clubsJoined ?? userClubs.length}
                      </div>
                      <div className="text-sm text-gray-500">Clubs Joined</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {userStats?.upcomingEvents ?? upcomingEvents.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Upcoming Events
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">
                        {userStats?.leadershipRoles ?? 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Leadership Roles
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {userStats?.avgEngagement ?? 0}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg Engagement
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Empty State */}
            {userClubs.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Clubs Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You haven't joined any clubs yet. Discover clubs that match
                    your interests!
                  </p>
                  <Button onClick={() => navigate("/discover")}>
                    Browse Clubs
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity & Upcoming Events */}
            {userClubs.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4 text-center">
                        No recent activity
                      </p>
                    ) : (
                      recentActivity.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                        >
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {activity.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activity.clubName} • {activity.time}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingEvents.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4 text-center">
                        No upcoming events
                      </p>
                    ) : (
                      upcomingEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-blue-50"
                        >
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-gray-600">
                              {event.clubName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.date} at {event.time}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={event.isRsvped ? "default" : "outline"}
                            onClick={() => handleRsvpToggle(event.id)}
                            disabled={actionLoading === event.id}
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Heart
                                  className={`w-3 h-3 mr-1 ${
                                    event.isRsvped ? "fill-current" : ""
                                  }`}
                                />
                                {event.isRsvped ? "RSVPed" : "RSVP"}
                              </>
                            )}
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Clubs Tab */}
          <TabsContent value="clubs" className="space-y-6">
            {userClubs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Clubs Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You haven't joined any clubs yet. Discover clubs that match
                    your interests!
                  </p>
                  <Button onClick={() => navigate("/discover")}>
                    Browse Clubs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {userClubs.map((club) => (
                  <div key={club.id}>
                    <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-[#012169] text-white">
                              {club.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xl font-semibold">
                                {club.name}
                              </h3>
                              {club.verified && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <Badge className={getRoleColor(club.role)}>
                                {club.role}
                              </Badge>
                              <span>
                                Joined{" "}
                                {new Date(club.joinDate).toLocaleDateString()}
                              </span>
                              <span>{club.memberCount} members</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Engagement Score</span>
                                <span className="font-medium">
                                  {club.engagement}%
                                </span>
                              </div>
                              <Progress
                                value={club.engagement}
                                className="w-48"
                              />
                            </div>

                            {club.nextEvent && (
                              <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm font-medium text-blue-900">
                                  Next Event
                                </div>
                                <div className="text-sm text-blue-700">
                                  {club.nextEvent.name}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {club.nextEvent.date} at {club.nextEvent.time}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(club)}
                            disabled={loadingDetailsId === club.id}
                          >
                            {loadingDetailsId === club.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              selectedClub?.id === club.id ? "Hide Details" : "View Details"
                            )}
                          </Button>
                          {club.role === "Officer" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/officers?clubId=${club.id}`)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Manage Club
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleLeaveClub(club.id, club.name)}
                            disabled={actionLoading === club.id}
                          >
                            {actionLoading === club.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4 mr-2" />
                            )}
                            Leave Club
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed View */}
                  {selectedClub?.id === club.id && (
                    <div
                      id={`club-details-${club.id}`}
                      className="bg-white border rounded-xl shadow-sm mt-4"
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between p-6 border-b">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {club.name}
                            </h2>
                            {club.verified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{club.memberCount} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline">{club.role}</Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {club.joinDate}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          className="p-2 rounded-full hover:bg-gray-100"
                          onClick={() => setSelectedClub(null)}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Details content */}
                      <div className="p-6 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Club Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{club.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Engagement:</span>
                              <span className="font-medium">{club.engagement}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Activity:</span>
                              <span className="font-medium">{club.lastActivity}</span>
                            </div>
                          </div>
                        </div>

                        {club.nextEvent && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Upcoming Event</h3>
                            <div className="bg-blue-50 p-4 rounded-md space-y-2">
                              <div className="font-medium text-blue-900">
                                {club.nextEvent.name}
                              </div>
                              <div className="text-sm text-blue-700">
                                {club.nextEvent.date} at {club.nextEvent.time}
                              </div>
                            </div>
                          </div>
                        )}

                        {club.recentActivity && club.recentActivity.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                            <div className="space-y-2">
                              {club.recentActivity.map((activity, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md"
                                >
                                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {activity.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {activity.time}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3 pt-4 border-t">
                          {club.role === "Officer" && (
                            <Button
                              onClick={() => navigate(`/officers?clubId=${club.id}`)}
                              className="flex-1"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Manage Club
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleLeaveClub(club.id, club.name)}
                            disabled={actionLoading === club.id}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {actionLoading === club.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4 mr-2" />
                            )}
                            Leave Club
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No upcoming events from your clubs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Calendar className="w-5 h-5 text-[#012169]" />
                          <div>
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm text-gray-600">
                              {event.clubName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.date} at {event.time}
                              {event.location && ` • ${event.location}`}
                            </div>
                            {event.capacity && (
                              <div className="text-xs text-gray-400">
                                {event.registered}/{event.capacity} registered
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant={event.isRsvped ? "default" : "outline"}
                            onClick={() => handleRsvpToggle(event.id)}
                            disabled={actionLoading === event.id}
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Heart
                                  className={`w-3 h-3 mr-1 ${
                                    event.isRsvped ? "fill-current" : ""
                                  }`}
                                />
                                {event.isRsvped ? "RSVPed" : "RSVP"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  