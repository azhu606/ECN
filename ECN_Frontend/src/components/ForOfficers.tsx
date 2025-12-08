import { useState, useEffect } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../authSession";

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

const API_BASE =  "/api";

const userId = getCurrentUserId();

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
  description: string | null;
  date: string | null;
  time: string | null;
  startTime: string | null; // NEW
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

interface OfficerClub {
  id: string;
  name: string;
  verified: boolean;
  role: string; // "president" | "officer"
}

const emptyMetrics: ClubMetrics = {
  members: 0,
  memberGrowth: 0,
  eventAttendance: 0,
  attendanceRate: 0,
  profileViews: 0,
  profileGrowth: 0,
  freshnessScore: 0,
  engagementScore: 0,
};

interface ForOfficersProps {
  isLoggedIn: boolean;
  clubId: string; // kept for compatibility; we ignore it if we have a currentClubId
  apiBaseUrl?: string;
}

export function ForOfficers({
  isLoggedIn,
  clubId,
  apiBaseUrl,
}: ForOfficersProps) {
  const navigate = useNavigate();

  const effectiveBase = API_BASE;

  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Which club(s) this user can manage
  const [officerClubs, setOfficerClubs] = useState<OfficerClub[]>([]);
  const [loadingClubs, setLoadingClubs] = useState<boolean>(true);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [currentClubName, setCurrentClubName] = useState<string>("");

  const [showRegisterClubDialog, setShowRegisterClubDialog] = useState(false);

  // Other UI state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  // Members / invite / kick
  const [members, setMembers] = useState<Member[]>([]);
  const [memberToKick, setMemberToKick] = useState<Member | null>(null);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    memberName: "",
    memberEmail: "",
    message: "",
  });

  // Metrics
  const [clubMetrics, setClubMetrics] = useState<ClubMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Profile
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Events & activity
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]); // you can wire this later

  const [editingEvent, setEditingEvent] = useState<UpcomingEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toLocalInputValue = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const openEditEvent = (event: UpcomingEvent) => {
    setEditingEvent(event);
    setEditTitle(event.name);
    setEditDescription(event.description ?? "");
    setEditLocation(event.location ?? "");
    setEditCapacity(
      event.capacity !== null && event.capacity !== undefined
        ? String(event.capacity)
        : ""
    );
    setEditDateTime(toLocalInputValue(event.startTime));
  };
  const handleSaveEditedEvent = async () => {
    if (!editingEvent) return;

    try {
      setEditSaving(true);
      setEventError(null);

      const start = editDateTime ? new Date(editDateTime) : null;
      const body: any = {
        title: editTitle,
        description: editDescription || null,
        location: editLocation || null,
        capacity: editCapacity ? Number(editCapacity) : null,
      };

      if (start) {
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour default
        body.startTime = start.toISOString();
        body.endTime = end.toISOString();
      }

      const res = await fetch(`${effectiveBase}/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update event (${res.status})`);
      }

      if (effectiveClubId) {
        await loadEventsForClub(effectiveClubId);
      }
      setEditingEvent(null);
    } catch (err: any) {
      console.error("Failed to update event", err);
      setEventError(err.message || "Failed to update event.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      setDeleteLoading(true);
      setEventError(null);

      const res = await fetch(`${effectiveBase}/events/${editingEvent.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to delete event (${res.status})`);
      }

      if (effectiveClubId) {
        await loadEventsForClub(effectiveClubId);
      }
      setEditingEvent(null);
    } catch (err: any) {
      console.error("Failed to delete event", err);
      setEventError(err.message || "Failed to delete event.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Registration form (for "Register Club" dialog)
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

  // Events & activity
  const loadEventsForClub = async (clubId: string) => {
    try {
      const res = await fetch(
        `${effectiveBase}/clubs/${clubId}/events?upcoming=true`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data: UpcomingEvent[] = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load club events", err);
    }
  };
  const handleCreateEvent = async () => {
    if (!effectiveClubId) return;

    if (!newEventTitle || !newEventDateTime) {
      // minimal guard so we don't send totally empty stuff
      alert("Please enter a title and date/time");
      return;
    }

    try {
      setCreatingEvent(true);
      setEventError(null);

      const start = new Date(newEventDateTime);
      // simple 1-hour default end time
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const res = await fetch(`${effectiveBase}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // adjust keys if your create_event() expects slightly different names
          clubId: effectiveClubId,
          title: newEventTitle,
          description: newEventDescription || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create event (${res.status})`);
      }

      // event created – now refresh the upcoming list for this club
      await loadEventsForClub(effectiveClubId);

      // clear form
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventDateTime("");
    } catch (err: any) {
      console.error("Error creating event", err);
      setEventError(err.message || "Failed to create event.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // NEW: quick-create event state + error
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventDateTime, setNewEventDateTime] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const effectiveClubId = currentClubId || clubId || "";

  const metrics: ClubMetrics = clubMetrics ?? emptyMetrics;

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

  // --------------------------------------------------
  // 1) Fetch officer clubs for this user
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const fetchOfficerClubs = async () => {
      try {
        setLoadingClubs(true);
        setClubsError(null);

        const url = `${effectiveBase}/students/${userId}/officer-clubs`;
        console.log("Fetching officer clubs from:", url);

        const res = await fetch(url, { credentials: "include" });
        console.log("officer-clubs status:", res.status);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("officer-clubs error body:", body);
          throw new Error(body.error || `Failed to load clubs (${res.status})`);
        }

        const data: OfficerClub[] = await res.json();
        console.log("officerClubs from API:", data);

        setOfficerClubs(data);

        if (data.length > 0) {
          setCurrentClubId(data[0].id);
          setCurrentClubName(data[0].name);
        } else {
          setCurrentClubId(null);
          setCurrentClubName("");
        }
      } catch (err: any) {
        console.error("Error loading officer clubs", err);
        setClubsError(err.message || "Unable to load your clubs.");
      } finally {
        setLoadingClubs(false);
      }
    };

    fetchOfficerClubs();
  }, [isLoggedIn, effectiveBase]);

  // --------------------------------------------------
  // 2) Fetch metrics + profile when club changes
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn || !effectiveClubId) return;

    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        setMetricsError(null);
        const res = await fetch(
          `${effectiveBase}/clubs/${effectiveClubId}/metrics`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Failed to load metrics (${res.status})`
          );
        }
        const data: ClubMetrics = await res.json();
        setClubMetrics(data);
      } catch (err: any) {
        console.error("Error loading club metrics", err);
        setMetricsError(
          err.message || "Unable to load club analytics right now."
        );
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
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Failed to load profile (${res.status})`
          );
        }
        const data: ClubProfile = await res.json();
        setClubProfile(data);
      } catch (err: any) {
        console.error("Error loading club profile", err);
        setProfileError(
          err.message || "Unable to load club profile right now."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchMetrics();
    fetchProfile();
  }, [isLoggedIn, effectiveBase, effectiveClubId]);

  // --------------------------------------------------
  // 3) Fetch events + members when club changes
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn || !effectiveClubId) return;

    loadEventsForClub(effectiveClubId);

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

    fetchMembers();
  }, [isLoggedIn, effectiveBase, effectiveClubId]);

  // --------------------------------------------------
  // Save profile
  // --------------------------------------------------
  const handleSaveProfile = async () => {
    if (!clubProfile || !effectiveClubId) return;
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

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRegistrationForm({
        ...registrationForm,
        charterFile: e.target.files[0],
      });
    }
  };

  const handleRegisterClub = () => {
    // hook this up to backend later
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

  // --------------------------------------------------
  // Auth gate
  // --------------------------------------------------
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
                your Emory email to access the officer dashboard.
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
                Sign In
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

  // --------------------------------------------------
  // No officer clubs: show simple "Register club" CTA
  // --------------------------------------------------
  if (!loadingClubs && officerClubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center py-10 px-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              You’re not an officer of any club yet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clubsError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{clubsError}</AlertDescription>
              </Alert>
            )}
            <p className="text-gray-600">
              Once you're listed as a president or officer for a club, it will
              appear here automatically.
            </p>
            <Button
              className="mt-2 bg-[#012169] hover:bg-[#001a5c]"
              onClick={() => setShowRegisterClubDialog(true)}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Register a Club
            </Button>
          </CardContent>
        </Card>

        {/* Register Club dialog is still rendered below in the main component */}
      </div>
    );
  }

  // --------------------------------------------------
  // Main Officer Dashboard (requires currentClubId)
  // --------------------------------------------------
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
                  {clubProfile?.name || currentClubName || "Loading club…"}
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

              {/* Inline club switcher – calls backend data already in officerClubs */}
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 mb-1">
                  Managing club
                </span>
                <Select
                  value={currentClubId ?? ""}
                  onValueChange={(clubId) => {
                    const club = officerClubs.find((c) => c.id === clubId);
                    if (!club) return;
                    setCurrentClubId(club.id);
                    setCurrentClubName(club.name);
                    // selectedTab stays the same; effects below will refetch with new clubId
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {officerClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  console.log("open register dialog");
                  setShowRegisterClubDialog(true);
                }}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Register Club
              </Button>
              {showRegisterClubDialog && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 z-[9999]">
                  DIALOG STATE = TRUE
                </div>
              )}
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
                Keep your club profile updated to maintain high discoverability.
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

            {/* Recent Activity placeholder list (empty is fine until wired) */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No recent activity yet.
                    </p>
                  )}
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
            {eventError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{eventError}</AlertDescription>
              </Alert>
            )}
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
                  <Input
                    type="datetime-local"
                    value={newEventDateTime}
                    onChange={(e) => setNewEventDateTime(e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Event description"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateEvent} disabled={creatingEvent}>
                    {creatingEvent ? "Creating..." : "Create & Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCreateEvent}
                    disabled={creatingEvent}
                  >
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No upcoming events yet.
                    </p>
                  )}
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditEvent(event)}
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
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-sm text-gray-500"
                        >
                          No members yet.
                        </TableCell>
                      </TableRow>
                    )}
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

      {/* Register Club Dialog */}
      <Dialog
        open={showRegisterClubDialog}
        onOpenChange={setShowRegisterClubDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Club</DialogTitle>
            <DialogDescription>
              Submit your club registration application. (Backend wiring
              pending.)
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
                Your club registration will be reviewed by Student Affairs once
                this feature is fully wired up.
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
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={!!editingEvent}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update details for{" "}
              <span className="font-semibold">
                {editingEvent?.name || "this event"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-datetime">Date &amp; time</Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={editDateTime}
                onChange={(e) => setEditDateTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min={0}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteEvent}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Event"}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedEvent}
                disabled={editSaving}
                className="bg-[#012169] hover:bg-[#001a5c]"
              >
                {editSaving ? "Saving..." : "Save Changes"}
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
              {clubProfile?.name || currentClubName || "your club"}.
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
