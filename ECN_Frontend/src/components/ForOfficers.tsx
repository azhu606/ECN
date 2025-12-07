import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Alert,
  AlertDescription,
} from "./ui/alert";

import {
  Users,
  Calendar,
  Mail,
  MessageSquare,
  Bell,
  CheckCircle,
  Settings,
  TrendingUp,
  Target,
  Plus,
  Edit,
  Eye,
  Award,
  Heart,
  Lock,
  ShieldAlert,
  Clock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// For now we are just pointing at a single seeded club.
// Later this should come from the logged-in officer's club.
const PLACEHOLDER_CLUB_ID = 1;

// -------- Types --------

interface ClubMetrics {
  members: number;
  memberGrowth: number;
  eventAttendance: number;
  attendanceRate: number;
  profileViews: number;
  profileGrowth: number;
  freshnessScore: number;
  engagementScore: number;
}

interface ClubProfile {
  id: number;
  name: string;
  description: string | null;
  purpose?: string | null;
  activities?: string | null;
  mediaUrls?: string[] | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  requestInfoFormUrl?: string | null;
  status: string;
  verified: boolean;
  lastUpdatedAt?: string | null;
}

// Dummy front-end activity/events for now
const recentActivity = [
  {
    id: "1",
    type: "join" as const,
    user: "Student 1",
    action: "joined your club",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "rsvp" as const,
    user: "Student 2",
    action: "RSVP’d to your event",
    time: "4 hours ago",
  },
  {
    id: "3",
    type: "review" as const,
    user: "Student 3",
    action: "left a new review",
    time: "1 day ago",
  },
];

const upcomingEvents = [
  {
    id: "1",
    name: "General Body Meeting",
    date: "Oct 20",
    time: "7:00 PM",
    location: "Goizueta Business School",
    status: "live" as const,
    registered: 45,
    capacity: 80,
  },
  {
    id: "2",
    name: "Recruiting Workshop",
    date: "Oct 25",
    time: "6:00 PM",
    location: "White Hall",
    status: "draft" as const,
    registered: 10,
    capacity: 60,
  },
];

export function ForOfficers() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  console.log("AUTH USER IN ForOfficers:", user);

  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  // Metrics state
  const [clubMetrics, setClubMetrics] = useState<ClubMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Profile state
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // ---------- Fetch metrics ----------
  useEffect(() => {
    async function fetchMetrics() {
      try {
        setMetricsLoading(true);
        setMetricsError(null);
        const res = await fetch(
          `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/metrics`,
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load metrics (${res.status})`);
        }
        const data: ClubMetrics = await res.json();
        setClubMetrics(data);
      } catch (err) {
        console.error("Error loading club metrics", err);
        setMetricsError("Unable to load club analytics right now.");
      } finally {
        setMetricsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  // ---------- Fetch profile ----------
  useEffect(() => {
    async function fetchProfile() {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const res = await fetch(
          `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/profile`,
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load profile (${res.status})`);
        }
        const data: ClubProfile = await res.json();
        setClubProfile(data);
      } catch (err) {
        console.error("Error loading club profile", err);
        setProfileError("Unable to load club profile right now.");
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const metrics: ClubMetrics = clubMetrics ?? {
    members: 0,
    memberGrowth: 0,
    eventAttendance: 0,
    attendanceRate: 0,
    profileViews: 0,
    profileGrowth: 0,
    freshnessScore: 0,
    engagementScore: 0,
  };

  const lastUpdatedLabel = (() => {
    if (!clubProfile?.lastUpdatedAt) return "Last updated —";
    const updated = new Date(clubProfile.lastUpdatedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return "Last updated today";
    if (diffDays === 1) return "Last updated 1 day ago";
    return `Last updated ${diffDays} days ago`;
  })();

  const handleSaveProfile = async () => {
    if (!clubProfile) return;
    try {
      setProfileSaving(true);
      setProfileError(null);

      const res = await fetch(
        `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: clubProfile.name,
            description: clubProfile.description,
            purpose: clubProfile.purpose,
            activities: clubProfile.activities,
            mediaUrls: clubProfile.mediaUrls,
            contactEmail: clubProfile.contactEmail,
            contactPhone: clubProfile.contactPhone,
            requestInfoFormUrl: clubProfile.requestInfoFormUrl,
            status: clubProfile.status,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Save failed (${res.status})`);
      }

      const data: ClubProfile = await res.json();
      setClubProfile(data);
    } catch (err: any) {
      console.error("Error saving club profile", err);
      setProfileError(err.message || "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ---------- Auth gate ----------
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
                Officer Access Required
              </h2>
              <p className="text-gray-600">
                This page is exclusively for club officers. Please sign in with
                your NetID to access the officer dashboard.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-left text-blue-900">
                  <p className="font-semibold">Officer Dashboard Features:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• Manage club events and announcements</li>
                    <li>• Track member engagement and analytics</li>
                    <li>• Update club profile information</li>
                    <li>• View and respond to member inquiries</li>
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
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full h-11 text-base"
              >
                Back to Homepage
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Do not have officer access? Contact your club president or visit
              the main site to join clubs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Helpers ----------
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "join":
        return <Users className="w-4 h-4 text-green-500" />;
      case "rsvp":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "inquiry":
        return <Mail className="w-4 h-4 text-orange-500" />;
      case "review":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "live":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TEMP: show UUID so you can verify login */}
      <div className="px-4 pt-4 text-xs text-red-600 font-mono">
        Logged-in UUID: {user?.id}
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Officer Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your club and track engagement
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge className="bg-[#012169]">
                  {clubProfile?.name || "Your Club"}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    clubProfile?.verified
                      ? "text-green-600 border-green-200"
                      : "text-gray-600 border-gray-200"
                  }
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {clubProfile?.verified ? "Verified" : "Not Verified"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-200"
                >
                  Officer Access
                </Badge>
              </div>
              {metricsLoading && (
                <p className="mt-2 text-xs text-gray-400">
                  Loading latest analytics…
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#012169]">
                  {metrics.freshnessScore}%
                </div>
                <div className="text-sm text-gray-500">Freshness Score</div>
              </div>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Club Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Your club profile was recently updated. Keep your information
                fresh with regular updates to maintain high discoverability.
                <Button variant="link" className="p-0 ml-2 h-auto">
                  Update now →
                </Button>
              </AlertDescription>
            </Alert>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metrics.members}
                      </div>
                      <div className="text-sm text-gray-500">Total Members</div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{metrics.memberGrowth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metrics.eventAttendance}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg. Attendance
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">{metrics.attendanceRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metrics.profileViews}
                      </div>
                      <div className="text-sm text-gray-500">Profile Views</div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{metrics.profileGrowth}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {metrics.engagementScore}%
                      </div>
                      <div className="text-sm text-gray-500">Engagement</div>
                    </div>
                    <Target className="w-6 h-6 text-[#012169]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.action}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setSelectedTab("events")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setSelectedTab("profile")}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Club Profile
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowAnnouncementModal(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Announcement
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setSelectedTab("members")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Members
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setSelectedTab("analytics")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Events</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Create Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Event title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                  <Input type="datetime-local" />
                </div>
                <Textarea
                  placeholder="Event description"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button>Create and Publish</Button>
                  <Button variant="outline">Save as Draft</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{event.name}</h4>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.date} at {event.time} • {event.location}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.registered}/{event.capacity} registered
                        </div>
                        <Progress
                          value={(event.registered / event.capacity) * 100}
                          className="w-48 h-2"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Member Management</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-[#012169]">
                      {metrics.members}
                    </div>
                    <div className="text-sm text-gray-500">Total Members</div>
                    <div className="text-xs text-green-600">
                      +{metrics.memberGrowth} this month
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.memberGrowth}
                    </div>
                    <div className="text-sm text-gray-500">New This Month</div>
                    <div className="text-xs text-gray-500">
                      {metrics.members
                        ? `${Math.round(
                            (metrics.memberGrowth /
                              Math.max(
                                metrics.members - metrics.memberGrowth,
                                1
                              )) *
                              100
                          )}% growth rate`
                        : "Growth rate"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-500">Avg. Attendance</div>
                    <div className="text-xs text-green-600">
                      +3% vs last month
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Member Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Mass Email
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Export Member List
                </Button>
                <Button variant="outline" className="justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Manage Roles
                </Button>
                <Button variant="outline" className="justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Club Profile</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-blue-600">
                  {lastUpdatedLabel}
                </Badge>
                <Button
                  onClick={handleSaveProfile}
                  disabled={!clubProfile || profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {profileError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileLoading && (
                    <p className="text-sm text-gray-500">Loading profile…</p>
                  )}

                  {clubProfile && (
                    <>
                      <Input
                        placeholder="Club Name"
                        value={clubProfile.name}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            name: e.target.value,
                          })
                        }
                      />

                      <Textarea
                        placeholder="Club Description"
                        value={clubProfile.description ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                      />

                      <Textarea
                        placeholder="Club Purpose (optional)"
                        value={clubProfile.purpose ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            purpose: e.target.value,
                          })
                        }
                        rows={3}
                      />

                      <Textarea
                        placeholder="Typical Activities (optional)"
                        value={clubProfile.activities ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            activities: e.target.value,
                          })
                        }
                        rows={3}
                      />

                      <Input
                        placeholder="Contact Email"
                        value={clubProfile.contactEmail ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            contactEmail: e.target.value,
                          })
                        }
                      />

                      <Input
                        placeholder="Contact Phone"
                        value={clubProfile.contactPhone ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            contactPhone: e.target.value,
                          })
                        }
                      />

                      <Input
                        placeholder="Info Request Form URL"
                        value={clubProfile.requestInfoFormUrl ?? ""}
                        onChange={(e) =>
                          setClubProfile({
                            ...clubProfile,
                            requestInfoFormUrl: e.target.value,
                          })
                        }
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Freshness Score</span>
                      <span className="font-medium">
                        {metrics.freshnessScore}%
                      </span>
                    </div>
                    <Progress value={metrics.freshnessScore} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completeness</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <Progress value={95} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Verification Status</span>
                      <span className="font-medium">
                        {clubProfile?.verified ? "Verified ✓" : "Not verified"}
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Keep your profile updated to maintain high
                      discoverability.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Club Analytics</h2>

            {metricsError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{metricsError}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">
                        Engagement Score
                      </div>
                      <div className="text-2xl font-bold">
                        {metrics.engagementScore}/100
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Profile Views</div>
                      <div className="text-2xl font-bold">
                        {metrics.profileViews}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        +{metrics.profileGrowth}% vs last period
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">
                        Attendance Rate
                      </div>
                      <div className="text-2xl font-bold">
                        {metrics.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Avg. {metrics.eventAttendance} attendees / event
                      </div>
                    </div>
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Member Count</div>
                      <div className="text-2xl font-bold">
                        {metrics.members}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        +{metrics.memberGrowth} this period
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Detailed analytics charts would be displayed here.</p>
                  <p className="text-sm">
                    Track member growth, event attendance, and engagement over
                    time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Announcement Modal */}
      <Dialog
        open={showAnnouncementModal}
        onOpenChange={setShowAnnouncementModal}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Announcement to Members</DialogTitle>
            <DialogDescription>
              This announcement will be sent to all {metrics.members} members of{" "}
              {clubProfile?.name || "your club"} via email and in-app
              notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input id="subject" placeholder="Enter announcement subject..." />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Type your announcement here..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-900">
                Members will receive both email and push notifications.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAnnouncementModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Hook this up to backend announcement endpoint later
                alert(`Announcement sent to ${metrics.members} members!`);
                setAnnouncementText("");
                setShowAnnouncementModal(false);
              }}
              className="bg-[#012169] hover:bg-[#001a5c]"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
