import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  BarChart3,
  Users,
  Calendar,
  Settings,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Bell,
  Target,
  Award,
  Heart,
  MessageSquare,
  Lock,
  ShieldAlert,
  Trash2,
} from "lucide-react";

const PLACEHOLDER_CLUB_ID = "58c2bbc8-9c6d-488c-ba15-dc682966c160"; // TODO: replace with real club UUID
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

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
  id: string;
  name: string;
  description: string | null;
  purpose: string | null;
  activities: string | null;
  mediaUrls: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  requestInfoFormUrl: string | null;
  status: "active" | "inactive" | "delisted";
  verified: boolean;
  lastUpdatedAt: string | null; // ISO string
  updateRecencyBadge: string | null;
}

type EventStatus = "upcoming" | "past" | "cancelled";

interface UpcomingEvent {
  id: string;
  clubId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string; // ISO
  endTime: string;
  status: EventStatus;
  capacity: number | null;
  registeredCount: number;
  attendeeCount: number;
}

interface RecentActivity {
  id: string;
  type: "join" | "rsvp" | "inquiry" | "review";
  user: string;
  action: string;
  time: string;
}

const recentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "join",
    user: "Sarah Chen",
    action: "joined the club",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "rsvp",
    user: "Michael Rodriguez",
    action: "RSVP'd to Medical School Panel",
    time: "4 hours ago",
  },
  {
    id: "3",
    type: "inquiry",
    user: "Emily Johnson",
    action: "sent an info request",
    time: "6 hours ago",
  },
  {
    id: "4",
    type: "review",
    user: "David Park",
    action: "left a 5-star review",
    time: "1 day ago",
  },
];

interface ForOfficersProps {
  isLoggedIn: boolean;
}

export function ForOfficers({ isLoggedIn }: ForOfficersProps) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Quick-create event form fields
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventStart, setNewEventStart] = useState(""); // datetime-local string
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState("");

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

  // Events state
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Edit event dialog
  const [editingEvent, setEditingEvent] = useState<UpcomingEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch metrics
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

  // Fetch profile
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

  // Fetch upcoming events
  useEffect(() => {
    async function fetchEvents() {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const res = await fetch(
          `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/events?upcoming=true`,
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load events (${res.status})`);
        }
        const data: UpcomingEvent[] = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Error loading events", err);
        setEventsError("Unable to load upcoming events right now.");
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
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

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) {
      alert("Please enter an event title.");
      return;
    }
    if (!newEventStart || !newEventEnd) {
      alert("Please enter start and end times.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: newEventTitle.trim(),
            description: newEventDescription || null,
            location: newEventLocation || null,
            startTime: newEventStart,
            endTime: newEventEnd,
            capacity: newEventCapacity ? Number(newEventCapacity) : null,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Create failed (${res.status})`);
      }

      const created: UpcomingEvent = await res.json();
      setEvents((prev) =>
        [...prev, created].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      );

      // Clear form
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventLocation("");
      setNewEventStart("");
      setNewEventEnd("");
      setNewEventCapacity("");
    } catch (err: any) {
      console.error("Error creating event", err);
      alert(err.message || "Failed to create event.");
    }
  };

  // Open edit dialog
  const openEditDialog = (event: UpcomingEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingEvent(null);
  };

  // Save edits
  const handleSaveEventEdit = async () => {
    if (!editingEvent) return;
    if (!editingEvent.title.trim()) {
      alert("Title cannot be empty.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/events/${editingEvent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: editingEvent.title.trim(),
            description: editingEvent.description,
            location: editingEvent.location,
            startTime: editingEvent.startTime,
            endTime: editingEvent.endTime,
            capacity:
              editingEvent.capacity !== null
                ? Number(editingEvent.capacity)
                : null,
            status: editingEvent.status,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Update failed (${res.status})`);
      }

      const updated: UpcomingEvent = await res.json();
      setEvents((prev) =>
        prev
          .map((e) => (e.id === updated.id ? updated : e))
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
      );
      closeEditDialog();
    } catch (err: any) {
      console.error("Error updating event", err);
      alert(err.message || "Failed to update event.");
    }
  };

  // Delete event
  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    if (!window.confirm("Delete this event? This cannot be undone.")) return;

    try {
      const res = await fetch(
        `${API_BASE}/clubs/${PLACEHOLDER_CLUB_ID}/events/${editingEvent.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Delete failed (${res.status})`);
      }

      setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
      closeEditDialog();
    } catch (err: any) {
      console.error("Error deleting event", err);
      alert(err.message || "Failed to delete event.");
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
                    <li>• Track member engagement & analytics</li>
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
              Don't have officer access? Contact your club president or visit
              the main site to join clubs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-gray-50">
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
            {/* Freshness Alert */}
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

            {/* Recent Activity & Quick Actions */}
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
            </div>

            {/* Quick Create Event */}
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
                  <Input
                    placeholder="Location"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Start time</label>
                    <Input
                      type="datetime-local"
                      value={newEventStart}
                      onChange={(e) => setNewEventStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">End time</label>
                    <Input
                      type="datetime-local"
                      value={newEventEnd}
                      onChange={(e) => setNewEventEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <Textarea
                    placeholder="Event description"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                  />
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Capacity (optional)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={newEventCapacity}
                        onChange={(e) => setNewEventCapacity(e.target.value)}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreateEvent}>
                        Create &amp; Publish
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewEventTitle("");
                          setNewEventDescription("");
                          setNewEventLocation("");
                          setNewEventStart("");
                          setNewEventEnd("");
                          setNewEventCapacity("");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading && (
                  <p className="text-sm text-gray-500">Loading events…</p>
                )}
                {eventsError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>{eventsError}</AlertDescription>
                  </Alert>
                )}
                {!eventsLoading && events.length === 0 && !eventsError && (
                  <p className="text-sm text-gray-500">
                    No upcoming events yet. Create one above!
                  </p>
                )}

                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge className="bg-blue-50 text-blue-800 border border-blue-100">
                            {event.status === "cancelled"
                              ? "Cancelled"
                              : "Upcoming"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(event.startTime)} at{" "}
                          {formatTime(event.startTime)} •{" "}
                          {event.location || "Location TBA"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.capacity
                            ? `${event.registeredCount}/${event.capacity} registered`
                            : `${event.registeredCount} registered`}
                        </div>
                        {event.capacity && (
                          <Progress
                            value={
                              event.capacity
                                ? (event.registeredCount / event.capacity) * 100
                                : 0
                            }
                            className="w-48 h-2"
                          />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(event)}
                        >
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

              {/* growth card */}
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
                  <p>Detailed analytics charts would be displayed here</p>
                  <p className="text-sm">
                    Track member growth, event attendance, and engagement over
                    time
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Event Modal */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details or delete the event.
            </DialogDescription>
          </DialogHeader>

          {editingEvent && (
            <div className="space-y-4 py-4">
              <Input
                placeholder="Event title"
                value={editingEvent.title}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, title: e.target.value })
                }
              />

              <Input
                placeholder="Location"
                value={editingEvent.location || ""}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    location: e.target.value,
                  })
                }
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Start time</label>
                  <Input
                    type="datetime-local"
                    value={editingEvent.startTime.slice(0, 16)}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">End time</label>
                  <Input
                    type="datetime-local"
                    value={editingEvent.endTime.slice(0, 16)}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Textarea
                placeholder="Event description"
                value={editingEvent.description || ""}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    description: e.target.value,
                  })
                }
                rows={4}
              />

              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">
                    Capacity (optional)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={
                      editingEvent.capacity !== null
                        ? String(editingEvent.capacity)
                        : ""
                    }
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        capacity: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Status</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={editingEvent.status}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        status: e.target.value as EventStatus,
                      })
                    }
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteEvent}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveEventEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                Members will receive both email and push notifications
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
