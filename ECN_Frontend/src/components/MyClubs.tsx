import { useState } from "react";
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
  MessageSquare
} from "lucide-react";

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
  const [unreadCount] = useState(notifications.filter(n => !n.read).length);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "President": return "bg-purple-100 text-purple-800";
      case "Officer": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="w-4 h-4 text-blue-500" />;
      case "announcement": return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "update": return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
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
              <p className="text-gray-600 mt-2">Manage your club memberships and stay updated</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-[#012169]">{userClubs.length}</div>
                <div className="text-sm text-gray-500">Active Memberships</div>
              </div>
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
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clubs">My Clubs ({userClubs.length})</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs min-w-[1.25rem] h-5">
                  {unreadCount}
                </Badge>
              )}
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
                      <div className="text-2xl font-bold">{userClubs.length}</div>
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
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-gray-500">Upcoming Events</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-sm text-gray-500">Leadership Role</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">75%</div>
                      <div className="text-sm text-gray-500">Avg Engagement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userClubs.flatMap(club => 
                    club.recentActivity.map((activity, idx) => (
                      <div key={`${club.id}-${idx}`} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-gray-500">{club.name} • {activity.time}</div>
                        </div>
                      </div>
                    ))
                  ).slice(0, 5)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userClubs.filter(club => club.nextEvent).map(club => (
                    <div key={club.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <div>
                        <div className="font-medium">{club.nextEvent!.name}</div>
                        <div className="text-sm text-gray-600">{club.name}</div>
                        <div className="text-xs text-gray-500">
                          {club.nextEvent!.date} at {club.nextEvent!.time}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Heart className="w-3 h-3 mr-1" />
                        RSVP
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clubs Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <div className="grid gap-6">
              {userClubs.map(club => (
                <Card key={club.id} className="hover:shadow-lg transition-shadow duration-200">
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
                            <h3 className="text-xl font-semibold">{club.name}</h3>
                            {club.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <Badge className={getRoleColor(club.role)}>{club.role}</Badge>
                            <span>Joined {new Date(club.joinDate).toLocaleDateString()}</span>
                            <span>{club.memberCount} members</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Engagement Score</span>
                              <span className="font-medium">{club.engagement}%</span>
                            </div>
                            <Progress value={club.engagement} className="w-48" />
                          </div>

                          {club.nextEvent && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <div className="text-sm font-medium text-blue-900">Next Event</div>
                              <div className="text-sm text-blue-700">{club.nextEvent.name}</div>
                              <div className="text-xs text-blue-600">
                                {club.nextEvent.date} at {club.nextEvent.time}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button size="sm">Manage</Button>
                        <Button size="sm" variant="outline">View Details</Button>
                        {club.role === "Member" && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            Leave Club
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userClubs.filter(club => club.nextEvent).map(club => (
                    <div key={club.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="w-5 h-5 text-[#012169]" />
                        <div>
                          <div className="font-medium">{club.nextEvent!.name}</div>
                          <div className="text-sm text-gray-600">{club.name}</div>
                          <div className="text-sm text-gray-500">
                            {club.nextEvent!.date} at {club.nextEvent!.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">View Details</Button>
                        <Button size="sm" variant="outline">
                          <Heart className="w-3 h-3 mr-1" />
                          RSVP
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <div key={notification.id} 
                         className={`p-4 border rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{notification.club}</Badge>
                            <Badge className="text-xs">{notification.type}</Badge>
                            {!notification.read && (
                              <Badge className="bg-blue-600 text-xs">New</Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <Button size="sm" variant="ghost">
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}