import { useState } from "react";
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
  TrendingDown,
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
  ShieldAlert
} from "lucide-react";

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

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  status: "draft" | "published" | "live";
}

interface RecentActivity {
  id: string;
  type: "join" | "rsvp" | "inquiry" | "review";
  user: string;
  action: string;
  time: string;
}

const clubMetrics: ClubMetrics = {
  members: 180,
  memberGrowth: 12,
  eventAttendance: 89,
  attendanceRate: 76,
  profileViews: 245,
  profileGrowth: 8,
  freshnessScore: 92,
  engagementScore: 85
};

const upcomingEvents: UpcomingEvent[] = [
  {
    id: "1",
    name: "Medical School Panel",
    date: "2024-10-20",
    time: "7:00 PM",
    location: "Chemistry Building Room 240",
    capacity: 100,
    registered: 78,
    status: "published"
  },
  {
    id: "2",
    name: "MCAT Study Group",
    date: "2024-10-22",
    time: "6:00 PM",
    location: "Library Study Room 3A",
    capacity: 20,
    registered: 15,
    status: "published"
  },
  {
    id: "3",
    name: "Research Symposium",
    date: "2024-10-28",
    time: "2:00 PM",
    location: "Rollins School Auditorium",
    capacity: 200,
    registered: 45,
    status: "draft"
  }
];

const recentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "join",
    user: "Sarah Chen",
    action: "joined the club",
    time: "2 hours ago"
  },
  {
    id: "2",
    type: "rsvp",
    user: "Michael Rodriguez",
    action: "RSVP'd to Medical School Panel",
    time: "4 hours ago"
  },
  {
    id: "3",
    type: "inquiry",
    user: "Emily Johnson",
    action: "sent an info request",
    time: "6 hours ago"
  },
  {
    id: "4",
    type: "review",
    user: "David Park",
    action: "left a 5-star review",
    time: "1 day ago"
  }
];

interface ForOfficersProps {
  isLoggedIn: boolean;
}

export function ForOfficers({ isLoggedIn }: ForOfficersProps) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("events");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDateTime, setNewEventDateTime] = useState("");
  const [naturalLanguageEvent, setNaturalLanguageEvent] = useState("");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);  
  const [announcementText, setAnnouncementText] = useState("");

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
                This page is exclusively for club officers. Please sign in with your NetID to access the officer dashboard.
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
              Don't have officer access? Contact your club president or visit the main site to join clubs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "join": return <Users className="w-4 h-4 text-green-500" />;
      case "rsvp": return <Calendar className="w-4 h-4 text-blue-500" />;
      case "inquiry": return <Mail className="w-4 h-4 text-orange-500" />;
      case "review": return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "live": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const parseNaturalLanguageEvent = (text: string) => {
    // Mock parsing - in real implementation, this would use AI/NLP
    const parsed = {
      title: "",
      description: text,
      location: "",
      datetime: ""
    };

    // Simple keyword extraction
    const lowerText = text.toLowerCase();
    
    // Extract title from common patterns
    if (lowerText.includes("panel")) {
      parsed.title = "Medical School Panel";
    } else if (lowerText.includes("study group") || lowerText.includes("mcat")) {
      parsed.title = "MCAT Study Group";
    } else if (lowerText.includes("symposium") || lowerText.includes("research")) {
      parsed.title = "Research Symposium";
    } else {
      // Extract first few words as title
      const words = text.split(" ").slice(0, 3).join(" ");
      parsed.title = words.charAt(0).toUpperCase() + words.slice(1);
    }

    // Extract location
    const locationKeywords = ["chemistry building", "library", "auditorium", "room"];
    for (const keyword of locationKeywords) {
      if (lowerText.includes(keyword)) {
        const index = lowerText.indexOf(keyword);
        const locationPart = text.substring(index, index + 30);
        parsed.location = locationPart.split(" ").slice(0, 4).join(" ");
        break;
      }
    }

    // Extract date/time (simplified)
    const today = new Date();
    if (lowerText.includes("friday")) {
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
      if (lowerText.includes("7pm") || lowerText.includes("7:00")) {
        nextFriday.setHours(19, 0);
      }
      parsed.datetime = nextFriday.toISOString().slice(0, 16);
    }

    return parsed;
  };

  const handleQuickCreate = () => {
    if (!naturalLanguageEvent.trim()) return;
    
    const parsed = parseNaturalLanguageEvent(naturalLanguageEvent);
    setNewEventTitle(parsed.title);
    setNewEventDescription(parsed.description);
    setNewEventLocation(parsed.location);
    setNewEventDateTime(parsed.datetime);
    setShowCreateEventModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your club and track engagement</p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge className="bg-[#012169]">Pre-Medical Society</Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Officer Access
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#012169]">{clubMetrics.freshnessScore}%</div>
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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
                Your club profile was last updated 5 days ago. Keep your information fresh with regular updates to maintain high discoverability.
                <Button variant="link" className="p-0 ml-2 h-auto">Update now →</Button>
              </AlertDescription>
            </Alert>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{clubMetrics.members}</div>
                      <div className="text-sm text-gray-500">Total Members</div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{clubMetrics.memberGrowth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{clubMetrics.eventAttendance}</div>
                      <div className="text-sm text-gray-500">Avg. Attendance</div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">{clubMetrics.attendanceRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{clubMetrics.profileViews}</div>
                      <div className="text-sm text-gray-500">Profile Views</div>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{clubMetrics.profileGrowth}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{clubMetrics.engagementScore}%</div>
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
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
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
              <Button onClick={() => setShowCreateEventModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Quick Create Event */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Create Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your event in natural language (e.g., 'Medical school panel next Friday at 7pm in the chemistry building')"
                  value={naturalLanguageEvent}
                  onChange={(e) => setNaturalLanguageEvent(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={handleQuickCreate}>Create</Button>
                  <Button variant="outline">Save as Draft</Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="text-3xl font-bold text-[#012169]">{clubMetrics.members}</div>
                    <div className="text-sm text-gray-500">Total Members</div>
                    <div className="text-xs text-green-600">+{clubMetrics.memberGrowth} this month</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">15</div>
                    <div className="text-sm text-gray-500">New This Month</div>
                    <div className="text-xs text-gray-500">8% growth rate</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">{clubMetrics.attendanceRate}%</div>
                    <div className="text-sm text-gray-500">Avg. Attendance</div>
                    <div className="text-xs text-green-600">+3% vs last month</div>
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
                  Last updated 5 days ago
                </Badge>
                <Button>Save Changes</Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Club Name" defaultValue="Pre-Medical Society" />
                  <Textarea 
                    placeholder="Club Description" 
                    defaultValue="Supporting pre-medical students through MCAT prep, research opportunities, and medical school guidance."
                    rows={4}
                  />
                  <Input placeholder="Meeting Location" defaultValue="Chemistry Building Room 240" />
                  <Input placeholder="Meeting Time" defaultValue="Thursdays 6-7:30 PM" />
                  <Input placeholder="Website URL" defaultValue="https://premed.emory.edu" />
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
                      <span className="font-medium">{clubMetrics.freshnessScore}%</span>
                    </div>
                    <Progress value={clubMetrics.freshnessScore} />
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
                      <span>Contact Verification</span>
                      <span className="font-medium text-green-600">Verified ✓</span>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Update your profile within 7 days to maintain verification status.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Club Analytics</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Discoverability Index</div>
                      <div className="text-2xl font-bold">92/100</div>
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
                      <div className="text-2xl font-bold">{clubMetrics.profileViews}</div>
                    </div>
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Info Requests</div>
                      <div className="text-2xl font-bold">23</div>
                    </div>
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Avg. Rating</div>
                      <div className="text-2xl font-bold">4.8</div>
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
                  <p className="text-sm">Track member growth, event attendance, and engagement over time</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Announcement to Members</DialogTitle>
            <DialogDescription>
              This announcement will be sent to all {clubMetrics.members} members of Pre-Medical Society via email and in-app notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Enter announcement subject..."
              />
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
                // Here you would normally send the announcement to your backend
                alert(`Announcement sent to ${clubMetrics.members} members!`);
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


      
      {showCreateEventModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90vw'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Create New Event</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>Fill in the event details.</p>
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <Input 
                type="datetime-local" 
                value={newEventDateTime}
                onChange={(e) => setNewEventDateTime(e.target.value)}
                style={{ marginBottom: '8px' }} 
              />
              <Textarea
                placeholder="Event description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
                style={{ marginBottom: '8px' }}
              />
              <Input
                placeholder="Event location"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setShowCreateEventModal(false)}>
                Cancel
              </Button>
              <Button>Create Event</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}