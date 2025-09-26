import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import { 
  Search, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock,
  Filter,
  Grid,
  List,
  CheckCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  description: string;
  club: {
    name: string;
    verified: boolean;
  };
  date: string;
  time: string;
  endTime: string;
  location: string;
  category: string;
  capacity?: number;
  registered: number;
  isRSVPed: boolean;
  tags: string[];
  imageUrl?: string;
}

// User's clubs for filtering - these would come from user's actual club memberships
const myClubs = ["Pre-Medical Society", "Computer Science Society", "Sustainability Action Network"];

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Goldman Sachs Info Session",
    description: "Learn about investment banking opportunities and application processes. Q&A with current analysts and recruiters.",
    club: {
      name: "Goizueta Business Association",
      verified: true
    },
    date: "2024-10-18",
    time: "6:00 PM",
    endTime: "8:00 PM",
    location: "Goizueta Business School - Room 210",
    category: "Professional",
    capacity: 150,
    registered: 127,
    isRSVPed: false,
    tags: ["Finance", "Career", "Networking", "Investment Banking"]
  },
  {
    id: "2",
    name: "Medical School Application Workshop",
    description: "Essential tips for medical school applications, personal statements, and interview preparation.",
    club: {
      name: "Pre-Medical Society",
      verified: true
    },
    date: "2024-10-20",
    time: "7:00 PM",
    endTime: "9:00 PM",
    location: "Chemistry Building Room 240",
    category: "Academic",
    registered: 89,
    isRSVPed: true,
    tags: ["Medical School", "Applications", "MCAT", "Pre-Med"]
  },
  {
    id: "3",
    name: "Homecoming Step Show",
    description: "Annual step show competition featuring performances from various cultural organizations.",
    club: {
      name: "Black Student Alliance",
      verified: true
    },
    date: "2024-10-26",
    time: "7:30 PM",
    endTime: "10:00 PM",
    location: "Glenn Memorial Auditorium",
    category: "Cultural",
    capacity: 500,
    registered: 445,
    isRSVPed: true,
    tags: ["Cultural", "Performance", "Homecoming", "Competition"]
  },
  {
    id: "4",
    name: "Campus Sustainability Fair",
    description: "Explore eco-friendly initiatives, learn about composting, and discover sustainable living tips.",
    club: {
      name: "Sustainability Action Network",
      verified: true
    },
    date: "2024-10-23",
    time: "11:00 AM",
    endTime: "3:00 PM",
    location: "Quad (Rain location: DUC)",
    category: "Environmental",
    registered: 67,
    isRSVPed: false,
    tags: ["Sustainability", "Environment", "Fair", "Education"]
  },
  {
    id: "5",
    name: "Google Tech Talk: AI in Healthcare",
    description: "Engineers from Google AI discuss applications of machine learning in medical diagnosis and treatment.",
    club: {
      name: "Computer Science Society",
      verified: true
    },
    date: "2024-10-21",
    time: "5:30 PM",
    endTime: "7:00 PM",
    location: "Math & Science Center E208",
    category: "Technology",
    capacity: 80,
    registered: 76,
    isRSVPed: false,
    tags: ["AI", "Technology", "Healthcare", "Machine Learning"]
  },
  {
    id: "6",
    name: "Blue Ridge Hiking Trip",
    description: "Day trip to Blue Ridge Mountains with moderate hiking trails. Transportation and lunch provided.",
    club: {
      name: "Outdoor Adventure Club",
      verified: true
    },
    date: "2024-10-19",
    time: "7:00 AM",
    endTime: "8:00 PM",
    location: "Meet at Campus Life Pavilion",
    category: "Recreation",
    capacity: 25,
    registered: 23,
    isRSVPed: true,
    tags: ["Hiking", "Nature", "Day Trip", "Adventure"]
  }
];

export function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterRSVPed, setFilterRSVPed] = useState(false);
  const [filterMyClubs, setFilterMyClubs] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const categories = [
    "All Categories", 
    "Academic", 
    "Professional", 
    "Cultural", 
    "Environmental", 
    "Technology", 
    "Recreation",
    "Social"
  ];

  const filteredEvents = useMemo(() => {
    return mockEvents.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All Categories" || event.category === selectedCategory;
      
      const matchesDate = !selectedDate || event.date === selectedDate.toISOString().split('T')[0];
      
      const matchesRSVP = !filterRSVPed || event.isRSVPed;

      const matchesMyClubs = !filterMyClubs || myClubs.includes(event.club.name);

      return matchesSearch && matchesCategory && matchesDate && matchesRSVP && matchesMyClubs;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [searchTerm, selectedCategory, selectedDate, filterRSVPed, filterMyClubs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCapacityColor = (registered: number, capacity?: number) => {
    if (!capacity) return "text-gray-500";
    const percentage = (registered / capacity) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mockEvents.filter(event => {
      const eventDate = event.date;
      const matchesDate = eventDate === dateString;
      const matchesMyClubs = !filterMyClubs || myClubs.includes(event.club.name);
      const matchesCategory = selectedCategory === "All Categories" || event.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.club.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDate && matchesMyClubs && matchesCategory && matchesSearch;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Campus Events</h1>
                <p className="text-gray-600 mt-2">Discover and join events from across Emory</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode("list")} 
                        className={viewMode === "list" ? "bg-gray-100" : ""}>
                  <List className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewMode("grid")}
                        className={viewMode === "grid" ? "bg-gray-100" : ""}>
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events, clubs, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant={filterRSVPed ? "default" : "outline"} 
                onClick={() => setFilterRSVPed(!filterRSVPed)}
                className={`whitespace-nowrap ${filterRSVPed ? 'bg-[#012169] hover:bg-[#001a5c] text-white' : ''}`}
                title="Show only events you've RSVP'd to"
              >
                <Heart className={`w-4 h-4 mr-2 ${filterRSVPed ? 'fill-current' : ''}`} />
                My Events
              </Button>

              <Button 
                variant={filterMyClubs ? "default" : "outline"} 
                onClick={() => setFilterMyClubs(!filterMyClubs)}
                className={`whitespace-nowrap ${filterMyClubs ? 'bg-[#012169] hover:bg-[#001a5c] text-white' : ''}`}
                title="Show only events from clubs you're a member of"
              >
                <Users className={`w-4 h-4 mr-2 ${filterMyClubs ? 'fill-current' : ''}`} />
                My Clubs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Showing {filteredEvents.length} events
                {filterRSVPed && filterMyClubs && " (My Events + My Clubs)"}
                {filterRSVPed && !filterMyClubs && " (My Events)"}
                {!filterRSVPed && filterMyClubs && " (My Clubs)"}
              </p>
              {(filterRSVPed || filterMyClubs) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterRSVPed(false);
                    setFilterMyClubs(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </Button>
              )}
            </div>

            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className={viewMode === "grid" ? "space-y-4" : "flex gap-6"}>
                      {/* Event Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-[#012169]">{event.category}</Badge>
                              {event.isRSVPed && (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  <Heart className="w-3 h-3 mr-1 fill-current" />
                                  RSVP'd
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{event.club.name}</span>
                              {event.club.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed">
                          {event.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.time} - {event.endTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span className={getCapacityColor(event.registered, event.capacity)}>
                              {event.registered}{event.capacity ? `/${event.capacity}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {event.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`${viewMode === "grid" ? "w-full" : "w-32"} space-y-2`}>
                        <Button 
                          className={`w-full ${event.isRSVPed ? 'bg-green-600 hover:bg-green-700' : 'bg-[#012169] hover:bg-[#001a5c]'}`}
                        >
                          {event.isRSVPed ? 'Registered ✓' : 'RSVP'}
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Share2 className="w-3 h-3 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events today</h3>
              <p className="text-gray-600">Check the upcoming tab for events this week</p>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isCurrentMonthDay = isCurrentMonth(date);
                    const isTodayDate = isToday(date);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          bg-white min-h-[120px] p-2 border-r border-b border-gray-100
                          ${!isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''}
                          ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                        `}
                      >
                        {/* Date number */}
                        <div className={`
                          text-sm font-medium mb-1
                          ${isTodayDate ? 'text-blue-600' : ''}
                          ${!isCurrentMonthDay ? 'text-gray-400' : 'text-gray-900'}
                        `}>
                          {date.getDate()}
                          {isTodayDate && (
                            <span className="ml-1 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        
                        {/* Events for this day */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={event.id}
                              className={`
                                text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow
                                ${myClubs.includes(event.club.name) 
                                  ? 'bg-[#012169] text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
                                ${event.isRSVPed ? 'ring-1 ring-green-400' : ''}
                              `}
                              title={`${event.name} - ${event.club.name} at ${event.time}`}
                            >
                              <div className="flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate font-medium">{event.time}</span>
                              </div>
                              <div className="truncate">{event.name}</div>
                              {myClubs.includes(event.club.name) && (
                                <Badge variant="secondary" className="text-xs mt-1">My Club</Badge>
                              )}
                              {event.isRSVPed && (
                                <div className="flex items-center mt-1">
                                  <Heart className="w-2.5 h-2.5 fill-current text-green-400" />
                                  <span className="ml-1 text-xs">RSVP'd</span>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 p-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-6 space-y-2">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-[#012169] rounded"></div>
                      <span>My Clubs Events</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                      <span>Other Events</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-green-400 fill-current" />
                      <span>RSVP'd Events (My Events)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
                      <span>Today</span>
                    </div>
                  </div>
                  {(filterRSVPed || filterMyClubs) && (
                    <div className="text-xs text-gray-500 italic">
                      Active filters: {filterRSVPed && "My Events"} {filterRSVPed && filterMyClubs && " + "} {filterMyClubs && "My Clubs"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}