import { useState, useEffect } from "react";
import type React from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  UserX,
  ArrowDown,
  RefreshCw,
  Upload,
  FileText,
  Building2,
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

interface UpcomingEvent {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  capacity: number | null;
  registered: number;
  status: "draft" | "published" | "live" | string;
}

interface RecentActivity {
  id: string;
  type: "join" | "rsvp" | "inquiry" | "review" | string;
  user: string;
  action: string;
  time: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  position: "president" | "officer" | "member" | string;
  joinDate: string;
  eventsAttended: number;
}

const clubMetricsFallback: ClubMetrics = {
  members: 180,
  memberGrowth: 12,
  eventAttendance: 89,
  attendanceRate: 76,
  profileViews: 245,
  profileGrowth: 8,
  freshnessScore: 92,
  engagementScore: 85,
};

const upcomingEventsFallback: UpcomingEvent[] = [
  {
    id: "1",
    name: "Medical School Panel",
    date: "2024-10-20",
    time: "7:00 PM",
    location: "Chemistry Building Room 240",
    capacity: 100,
    registered: 78,
    status: "published",
  },
  {
    id: "2",
    name: "MCAT Study Group",
    date: "2024-10-22",
    time: "6:00 PM",
    location: "Library Study Room 3A",
    capacity: 20,
    registered: 15,
    status: "published",
  },
  {
    id: "3",
    name: "Research Symposium",
    date: "2024-10-28",
    time: "2:00 PM",
    location: "Rollins School Auditorium",
    capacity: 200,
    registered: 45,
    status: "draft",
  },
];

const recentActivityFallback: RecentActivity[] = [
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

const initialMembers: Member[] = [
  {
    id: "1",
    name: "John Williams",
    email: "john.williams@emory.edu",
    position: "president",
    joinDate: "2023-08-15",
    eventsAttended: 24,
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah.chen@emory.edu",
    position: "officer",
    joinDate: "2023-09-01",
    eventsAttended: 22,
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    email: "michael.rodriguez@emory.edu",
    position: "officer",
    joinDate: "2023-09-01",
    eventsAttended: 20,
  },
  {
    id: "4",
    name: "Emily Johnson",
    email: "emily.johnson@emory.edu",
    position: "officer",
    joinDate: "2023-09-15",
    eventsAttended: 18,
  },
  {
    id: "5",
    name: "David Park",
    email: "david.park@emory.edu",
    position: "member",
    joinDate: "2024-01-20",
    eventsAttended: 15,
  },
  {
    id: "6",
    name: "Amanda Thompson",
    email: "amanda.thompson@emory.edu",
    position: "member",
    joinDate: "2024-02-10",
    eventsAttended: 12,
  },
  {
    id: "7",
    name: "James Lee",
    email: "james.lee@emory.edu",
    position: "member",
    joinDate: "2024-03-05",
    eventsAttended: 10,
  },
  {
    id: "8",
    name: "Maria Garcia",
    email: "maria.garcia@emory.edu",
    position: "member",
    joinDate: "2024-04-12",
    eventsAttended: 8,
  },
  {
    id: "9",
    name: "Kevin Patel",
    email: "kevin.patel@emory.edu",
    position: "member",
    joinDate: "2024-05-18",
    eventsAttended: 6,
  },
  {
    id: "10",
    name: "Lisa Wong",
    email: "lisa.wong@emory.edu",
    position: "member",
    joinDate: "2024-06-22",
    eventsAttended: 4,
  },
];

const availableClubs = [
  { id: "1", name: "Pre-Medical Society", verified: true },
  { id: "2", name: "Computer Science Society", verified: true },
  { id: "3", name: "Debate Society", verified: false },
];

interface ForOfficersProps {
  isLoggedIn: boolean;
  clubId: string;
  apiBaseUrl?: string; // e.g. "/api"
}

export function ForOfficers({
  isLoggedIn,
  clubId,
  apiBaseUrl,
}: ForOfficersProps) {
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  // Members / club switching / registration / invite state (placeholders)
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [memberToKick, setMemberToKick] = useState<Member | null>(null);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [showSwitchClubDialog, setShowSwitchClubDialog] = useState(false);
  const [showRegisterClubDialog, setShowRegisterClubDialog] = useState(false);
  const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false);
  const [currentClub, setCurrentClub] = useState("Pre-Medical Society");
  const [selectedClubToSwitch, setSelectedClubToSwitch] = useState("");

  const [registrationForm, setRegistrationForm] = useState({
    clubName: "",
    category: "Academic",
    description: "",
    school: "",
    presidentName: "",
    presidentEmail: "",
    meetingLocation: "",
    meetingTime: "",
    website: "",
    charterFile: null as File | null,
  });

  const [inviteForm, setInviteForm] = useState({
    memberName: "",
    memberEmail: "",
    message: "",
  });

  // Metrics state (backed by backend but with fallback placeholder)
  const [clubMetrics, setClubMetrics] = useState<ClubMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Profile state (backend)
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Events & activity (placeholder + optional backend)
  const [events, setEvents] = useState<UpcomingEvent[]>(upcomingEventsFallback);
  const [activity, setActivity] = useState<RecentActivity[]>(
    recentActivityFallback
  );

  const effectiveBase = apiBaseUrl ?? API_BASE;
  const effectiveClubId = clubId || PLACEHOLDER_CLUB_ID;

  const metrics: ClubMetrics = clubMetrics ?? clubMetricsFallback;

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

  // Fetch metrics + profile from backend
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        setMetricsError(null);
        const res = await fetch(
          `${effectiveBase}/clubs/${effectiveClubId}/metrics`,
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
    };

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const res = await fetch(
          `${effectiveBase}/clubs/${effectiveClubId}/profile`,
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
    };

    fetchMetrics();
    fetchProfile();
  }, [isLoggedIn, effectiveBase, effectiveClubId]);

  // Fetch events + members (optional backend; keeps placeholder if it fails)
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch(
          `${effectiveBase}/clubs/${effectiveClubId}/events?upcoming=true`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data: UpcomingEvent[] = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load club events", err);
      }
    };

    const fetchMembers = async () => {
      try {
        const res = await fetch(
          `${effectiveBase}/clubs/${effectiveClubId}/members`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data: Member[] = await res.json();
        console.log("MEMBERS FROM API:", data);
        setMembers(data);
      } catch (err) {
        console.error("Failed to load club members", err);
      }
    };

    // Optional future: fetch activity from backend and call setActivity
    fetchEvents();
    fetchMembers();
  }, [isLoggedIn, effectiveBase, effectiveClubId]);

  const handleSaveProfile = async () => {
    if (!clubProfile) return;
    try {
      setProfileSaving(true);
      setProfileError(null);

      const res = await fetch(
        `${effectiveBase}/clubs/${effectiveClubId}/profile`,
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

  // --------------------
  // Helpers
  // --------------------
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

  const handleKickMember = (member: Member) => {
    setMemberToKick(member);
    setShowKickDialog(true);
  };

  const confirmKickMember = () => {
    if (memberToKick) {
      setMembers(members.filter((m) => m.id !== memberToKick.id));
      setShowKickDialog(false);
      setMemberToKick(null);
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "president":
        return <Badge className="bg-purple-600">President</Badge>;
      case "officer":
        return <Badge className="bg-blue-600">Officer</Badge>;
      case "member":
        return <Badge variant="outline">Member</Badge>;
      default:
        return null;
    }
  };

  const handleSwitchClub = () => {
    if (selectedClubToSwitch) {
      setCurrentClub(selectedClubToSwitch);
      setShowSwitchClubDialog(false);
      setSelectedClubToSwitch("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRegistrationForm({
        ...registrationForm,
        charterFile: e.target.files[0],
      });
    }
  };

  const handleRegisterClub = () => {
    // placeholder, backend integration handled elsewhere
    console.log("Registering club:", registrationForm);
    setRegistrationForm({
      clubName: "",
      category: "Academic",
      description: "",
      school: "",
      presidentName: "",
      presidentEmail: "",
      meetingLocation: "",
      meetingTime: "",
      website: "",
      charterFile: null,
    });
    setShowRegisterClubDialog(false);
  };

  const handleInviteMember = () => {
    console.log("Inviting member:", inviteForm);
    setInviteForm({
      memberName: "",
      memberEmail: "",
      message: "",
    });
    setShowInviteMemberDialog(false);
  };

  // --------------------
  // Main logged-in UI
  // --------------------
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
                  {clubProfile?.name || currentClub}
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
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#012169]">
                  {metrics.freshnessScore}%
                </div>
                <div className="text-sm text-gray-500">Freshness Score</div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSwitchClubDialog(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch Clubs
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRegisterClubDialog(true)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Register Club
              </Button>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Club Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="orgchart">Org Chart</TabsTrigger>
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

            {/* Recent Activity & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.map((activityItem) => (
                    <div
                      key={activityItem.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                    >
                      {getActivityIcon(activityItem.type)}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">
                            {activityItem.user}
                          </span>{" "}
                          {activityItem.action}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activityItem.time}
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
                  <Button>Create & Publish</Button>
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
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{event.name}</h4>
                          {event.status && (
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.date ?? "TBD"}{" "}
                          {event.time ? `at ${event.time}` : ""} •{" "}
                          {event.location ?? "Location TBA"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.registered}
                          {event.capacity
                            ? `/${event.capacity} registered`
                            : " registered"}
                        </div>
                        {event.capacity && event.capacity > 0 && (
                          <Progress
                            value={(event.registered / event.capacity) * 100}
                            className="w-48 h-2"
                          />
                        )}
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
              <Button onClick={() => setShowInviteMemberDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-[#012169]">
                      {members.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Members</div>
                    <div className="text-xs text-green-600">
                      +{metrics.memberGrowth} this month
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth card */}
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
                <CardTitle>Member List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Events Attended</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {getPositionBadge(member.position)}
                        </TableCell>
                        <TableCell>
                          {member.joinDate
                            ? new Date(member.joinDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>{member.eventsAttended}</TableCell>
                        <TableCell className="text-right">
                          {member.position !== "president" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleKickMember(member)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Kick
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-gray-400"
                            >
                              Protected
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

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

          {/* Org Chart Tab */}
          <TabsContent value="orgchart" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Organization Chart</h2>
              <Badge variant="outline" className="text-blue-600">
                Leadership Structure
              </Badge>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-8">
                  {/* President */}
                  {members
                    .filter((m) => m.position === "president")
                    .map((president) => (
                      <div
                        key={president.id}
                        className="flex flex-col items-center"
                      >
                        <div className="w-64 p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-600 rounded-lg shadow-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white">
                              <Users className="w-6 h-6" />
                            </div>
                            <Badge className="bg-purple-600">President</Badge>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {president.name}
                          </h3>
                          <p className="text-sm text-gray-600 break-all">
                            {president.email}
                          </p>
                        </div>

                        <ArrowDown className="w-6 h-6 text-gray-400 my-4" />
                      </div>
                    ))}

                  {/* Officers */}
                  <div className="grid md:grid-cols-3 gap-8">
                    {members
                      .filter((m) => m.position === "officer")
                      .map((officer) => (
                        <div
                          key={officer.id}
                          className="flex flex-col items-center"
                        >
                          <div className="w-56 p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg shadow-md">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <Users className="w-5 h-5" />
                              </div>
                              <Badge className="bg-blue-600">Officer</Badge>
                            </div>
                            <h3 className="font-semibold text-gray-900">
                              {officer.name}
                            </h3>
                            <p className="text-sm text-gray-600 break-all">
                              {officer.email}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Summary */}
                  <div className="w-full max-w-2xl mt-8 p-6 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Leadership Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {
                            members.filter((m) => m.position === "president")
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-600">President</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {
                            members.filter((m) => m.position === "officer")
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-600">Officers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {
                            members.filter((m) => m.position === "member")
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-600">Members</div>
                      </div>
                    </div>
                  </div>
                </div>
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
              {/* Engagement Score from backend */}
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

              {/* Profile Views */}
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

              {/* Attendance */}
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

              {/* Member count */}
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

      {/* Kick Member Confirmation Dialog */}
      <AlertDialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{memberToKick?.name}</span> from
              the club? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToKick(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmKickMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch Clubs Dialog */}
      <Dialog
        open={showSwitchClubDialog}
        onOpenChange={setShowSwitchClubDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Clubs</DialogTitle>
            <DialogDescription>
              Select a club to manage from your registered organizations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="club-select">Select Club</Label>
              <Select
                value={selectedClubToSwitch}
                onValueChange={setSelectedClubToSwitch}
              >
                <SelectTrigger id="club-select">
                  <SelectValue placeholder="Choose a club" />
                </SelectTrigger>
                <SelectContent>
                  {availableClubs.map((club) => (
                    <SelectItem key={club.id} value={club.name}>
                      <div className="flex items-center space-x-2">
                        <span>{club.name}</span>
                        {club.verified && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Current Club</p>
                  <p className="text-blue-700 mt-1">{currentClub}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSwitchClubDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwitchClub}
              disabled={!selectedClubToSwitch}
              className="bg-[#012169] hover:bg-[#001a5c]"
            >
              Switch Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Club Dialog */}
      <Dialog
        open={showRegisterClubDialog}
        onOpenChange={setShowRegisterClubDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Club</DialogTitle>
            <DialogDescription>
              Submit your club registration application. All fields are required
              for verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="club-name">Club Name *</Label>
                  <Input
                    id="club-name"
                    placeholder="e.g., Emory Innovation Society"
                    value={registrationForm.clubName}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        clubName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={registrationForm.category}
                    onValueChange={(value: any) =>
                      setRegistrationForm({
                        ...registrationForm,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Environmental">
                        Environmental
                      </SelectItem>
                      <SelectItem value="Recreation">Recreation</SelectItem>
                      <SelectItem value="Religious">Religious</SelectItem>
                      <SelectItem value="Greek Life">Greek Life</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">School Affiliation *</Label>
                <Input
                  id="school"
                  placeholder="e.g., Business School, Liberal Arts"
                  value={registrationForm.school}
                  onChange={(e) =>
                    setRegistrationForm({
                      ...registrationForm,
                      school: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Club Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of your club's mission and activities..."
                  rows={4}
                  value={registrationForm.description}
                  onChange={(e) =>
                    setRegistrationForm({
                      ...registrationForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* President Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                President Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="president-name">President Name *</Label>
                  <Input
                    id="president-name"
                    placeholder="Full name"
                    value={registrationForm.presidentName}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        presidentName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="president-email">President Email *</Label>
                  <Input
                    id="president-email"
                    type="email"
                    placeholder="president@emory.edu"
                    value={registrationForm.presidentEmail}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        presidentEmail: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Meeting Details</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting-location">Meeting Location *</Label>
                  <Input
                    id="meeting-location"
                    placeholder="e.g., Chemistry Building Room 240"
                    value={registrationForm.meetingLocation}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        meetingLocation: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-time">Meeting Time *</Label>
                  <Input
                    id="meeting-time"
                    placeholder="e.g., Tuesdays 7:00 PM"
                    value={registrationForm.meetingTime}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        meetingTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="https://your-club.emory.edu"
                  value={registrationForm.website}
                  onChange={(e) =>
                    setRegistrationForm({
                      ...registrationForm,
                      website: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Club Charter Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Club Charter</h3>

              <div className="space-y-2">
                <Label htmlFor="charter-upload">
                  Upload Club Charter (PDF) *
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#012169] transition-colors">
                  <div className="flex flex-col items-center space-y-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <label
                        htmlFor="charter-upload"
                        className="cursor-pointer"
                      >
                        <span className="text-sm font-medium text-[#012169] hover:underline">
                          Click to upload
                        </span>
                        <span className="text-sm text-gray-500">
                          {" "}
                          or drag and drop
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF file up to 10MB
                      </p>
                    </div>
                    <Input
                      id="charter-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {registrationForm.charterFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          {registrationForm.charterFile.name}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Your club registration will be reviewed by Student Affairs
                within 3-5 business days. You'll receive an email confirmation
                once approved.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegisterClubDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterClub}
              disabled={
                !registrationForm.clubName ||
                !registrationForm.description ||
                !registrationForm.school ||
                !registrationForm.presidentName ||
                !registrationForm.presidentEmail ||
                !registrationForm.meetingLocation ||
                !registrationForm.meetingTime ||
                !registrationForm.charterFile
              }
              className="bg-[#012169] hover:bg-[#001a5c]"
            >
              Submit Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog
        open={showInviteMemberDialog}
        onOpenChange={setShowInviteMemberDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new member to join your club.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Member Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member-name">Member Name *</Label>
                  <Input
                    id="member-name"
                    placeholder="Full name"
                    value={inviteForm.memberName}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        memberName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-email">Member Email *</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="member@emory.edu"
                    value={inviteForm.memberEmail}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        memberEmail: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your invitation..."
                  rows={4}
                  value={inviteForm.message}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      message: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteMemberDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteForm.memberName || !inviteForm.memberEmail}
              className="bg-[#012169] hover:bg-[#001a5c]"
            >
              Send Invitation
            </Button>
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
              {clubProfile?.name || currentClub || "your club"} via email and
              in-app notification.
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
