import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Star,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Clock
} from "lucide-react";

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  school: string[];
  members: number;
  rating: 4.5 | 4.6 | 4.7 | 4.8 | 4.9;
  verified: boolean;
  lastUpdated: string;
  nextEvent: {
    name: string;
    date: string;
    time: string;
    location: string;
  } | null;
  website?: string;
  tags: string[];
  activityScore: number; // For ranking
  discoverabilityIndex: number;
}

const mockClubs: Club[] = [
  {
    id: "1",
    name: "Goizueta Business Association",
    description: "The premier organization for business students, offering networking, case competitions, and career development.",
    category: "Professional",
    school: ["Business School", "Undergraduate"],
    members: 240,
    rating: 4.9,
    verified: true,
    lastUpdated: "2 hours ago",
    nextEvent: {
      name: "Goldman Sachs Info Session",
      date: "Oct 18",
      time: "6:00 PM",
      location: "Goizueta Business School"
    },
    website: "https://gba.emory.edu",
    tags: ["Finance", "Consulting", "Networking", "Career"],
    activityScore: 95,
    discoverabilityIndex: 98
  },
  {
    id: "2",
    name: "Pre-Medical Society",
    description: "Supporting pre-med students through MCAT prep, research opportunities, and medical school guidance.",
    category: "Academic",
    school: ["Pre-Med", "Undergraduate", "Graduate"],
    members: 180,
    rating: 4.8,
    verified: true,
    lastUpdated: "1 day ago",
    nextEvent: {
      name: "Medical School Panel",
      date: "Oct 20",
      time: "7:00 PM",
      location: "Chemistry Building Room 240"
    },
    website: "https://premed.emory.edu",
    tags: ["MCAT", "Research", "Medical School", "Healthcare"],
    activityScore: 88,
    discoverabilityIndex: 92
  },
  {
    id: "3",
    name: "Emory Debate Society",
    description: "Competitive parliamentary and policy debate with national tournament participation.",
    category: "Academic",
    school: ["Liberal Arts", "Undergraduate"],
    members: 45,
    rating: 4.8,
    verified: true,
    lastUpdated: "3 days ago",
    nextEvent: {
      name: "Southeast Regional Tournament",
      date: "Oct 22",
      time: "8:00 AM",
      location: "Dobbs University Center"
    },
    tags: ["Public Speaking", "Competition", "Critical Thinking", "Travel"],
    activityScore: 85,
    discoverabilityIndex: 87
  },
  {
    id: "4",
    name: "Nursing Student Association",
    description: "Professional development and advocacy for nursing students across all degree levels.",
    category: "Professional",
    school: ["Nursing School", "Graduate", "Undergraduate"],
    members: 120,
    rating: 4.7,
    verified: true,
    lastUpdated: "1 day ago",
    nextEvent: {
      name: "Clinical Skills Workshop",
      date: "Oct 19",
      time: "2:00 PM",
      location: "Nell Hodgson Woodruff School of Nursing"
    },
    website: "https://nursing.emory.edu/nsa",
    tags: ["Healthcare", "Clinical Skills", "Professional Development", "Advocacy"],
    activityScore: 82,
    discoverabilityIndex: 85
  },
  {
    id: "5",
    name: "Computer Science Society",
    description: "Connecting CS students through hackathons, tech talks, and industry networking events.",
    category: "Academic",
    school: ["Liberal Arts", "Undergraduate", "Graduate"],
    members: 200,
    rating: 4.6,
    verified: true,
    lastUpdated: "5 hours ago",
    nextEvent: {
      name: "Google Tech Talk",
      date: "Oct 21",
      time: "5:30 PM",
      location: "Math & Science Center E208"
    },
    website: "https://css.emory.edu",
    tags: ["Programming", "Hackathons", "Tech Industry", "Innovation"],
    activityScore: 90,
    discoverabilityIndex: 89
  },
  {
    id: "6",
    name: "Global Health Initiative",
    description: "Addressing health disparities through research, advocacy, and community engagement.",
    category: "Service",
    school: ["Public Health", "Liberal Arts", "Graduate"],
    members: 75,
    rating: 4.9,
    verified: true,
    lastUpdated: "6 hours ago",
    nextEvent: {
      name: "Health Equity Symposium",
      date: "Oct 25",
      time: "9:00 AM",
      location: "Rollins School of Public Health"
    },
    tags: ["Global Health", "Research", "Community Service", "Advocacy"],
    activityScore: 78,
    discoverabilityIndex: 84
  },
  {
    id: "7",
    name: "Black Student Alliance",
    description: "Fostering community, academic excellence, and cultural celebration for Black students.",
    category: "Cultural",
    school: ["All Schools", "Undergraduate", "Graduate"],
    members: 150,
    rating: 4.8,
    verified: true,
    lastUpdated: "4 hours ago",
    nextEvent: {
      name: "Homecoming Step Show",
      date: "Oct 26",
      time: "7:30 PM",
      location: "Glenn Memorial Auditorium"
    },
    tags: ["Cultural Celebration", "Academic Support", "Community", "Leadership"],
    activityScore: 86,
    discoverabilityIndex: 91
  },
  {
    id: "8",
    name: "Sustainability Action Network",
    description: "Environmental advocacy and sustainable living initiatives across campus.",
    category: "Environmental",
    school: ["Liberal Arts", "Public Health", "Undergraduate"],
    members: 95,
    rating: 4.7,
    verified: true,
    lastUpdated: "2 days ago",
    nextEvent: {
      name: "Campus Composting Workshop",
      date: "Oct 23",
      time: "3:00 PM",
      location: "Campus Life Pavilion"
    },
    tags: ["Sustainability", "Environmental Justice", "Campus Initiatives", "Advocacy"],
    activityScore: 75,
    discoverabilityIndex: 79
  }
];

const schoolOptions = [
  "All Schools",
  "Business School", 
  "Liberal Arts",
  "Public Health",
  "Nursing School",
  "Medical School",
  "Graduate",
  "Undergraduate",
  "Pre-Med"
];

const categoryOptions = [
  "All Categories",
  "Academic",
  "Professional", 
  "Cultural",
  "Service",
  "Environmental",
  "Recreation",
  "Greek Life",
  "Religious"
];

export function DiscoverClubs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("All Schools");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("discoverability");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const filteredAndSortedClubs = useMemo(() => {
    let filtered = mockClubs.filter(club => {
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           club.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSchool = selectedSchool === "All Schools" || 
                           club.school.includes(selectedSchool);
      
      const matchesCategory = selectedCategory === "All Categories" || 
                             club.category === selectedCategory;
      
      const matchesVerified = !showVerifiedOnly || club.verified;

      return matchesSearch && matchesSchool && matchesCategory && matchesVerified;
    });

    // Sort clubs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "discoverability":
          return b.discoverabilityIndex - a.discoverabilityIndex;
        case "members":
          return b.members - a.members;
        case "rating":
          return b.rating - a.rating;
        case "activity":
          return b.activityScore - a.activityScore;
        case "updated":
          // Simple recency sort (would use actual dates in real app)
          const aHours = a.lastUpdated.includes("hour") ? parseInt(a.lastUpdated) : 
                        a.lastUpdated.includes("day") ? parseInt(a.lastUpdated) * 24 : 72;
          const bHours = b.lastUpdated.includes("hour") ? parseInt(b.lastUpdated) : 
                        b.lastUpdated.includes("day") ? parseInt(b.lastUpdated) * 24 : 72;
          return aHours - bHours;
        default:
          return b.discoverabilityIndex - a.discoverabilityIndex;
      }
    });

    return filtered;
  }, [searchTerm, selectedSchool, selectedCategory, sortBy, showVerifiedOnly]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Discover Clubs</h1>
                <p className="text-gray-600 mt-2">Find your community from {mockClubs.length} active organizations</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Ranked by activity & engagement</span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search clubs, interests, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map(school => (
                      <SelectItem key={school} value={school}>{school}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discoverability">Discoverability</SelectItem>
                    <SelectItem value="members">Member Count</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="activity">Activity Score</SelectItem>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="verified"
                    checked={showVerifiedOnly}
                    onCheckedChange={setShowVerifiedOnly}
                  />
                  <label htmlFor="verified" className="text-sm font-medium">
                    Verified only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredAndSortedClubs.length} of {mockClubs.length} clubs
            </p>
            <div className="text-sm text-gray-500">
              Updated rankings as of today
            </div>
          </div>

          {/* Club Cards */}
          <div className="grid gap-6">
            {filteredAndSortedClubs.map((club, index) => (
              <Card key={club.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs font-medium">
                              #{index + 1}
                            </Badge>
                            <h3 className="text-xl font-semibold text-gray-900">{club.name}</h3>
                            {club.verified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{club.members} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{club.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Updated {club.lastUpdated}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed">
                        {club.description}
                      </p>

                      {/* School & Category Tags */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#012169] hover:bg-[#001a5c]">
                          {club.category}
                        </Badge>
                        {club.school.slice(0, 3).map((school, idx) => (
                          <Badge key={idx} variant="secondary">
                            {school}
                          </Badge>
                        ))}
                        {club.school.length > 3 && (
                          <Badge variant="secondary">
                            +{club.school.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Interest Tags */}
                      <div className="flex flex-wrap gap-1">
                        {club.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Next Event */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Next Event</span>
                      </h4>
                      {club.nextEvent ? (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                          <div className="font-medium text-blue-900">{club.nextEvent.name}</div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3" />
                              <span>{club.nextEvent.date} at {club.nextEvent.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 flex items-center justify-center">📍</span>
                              <span className="text-xs">{club.nextEvent.location}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-sm text-gray-500">No upcoming events</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Button className="w-full bg-[#012169] hover:bg-[#001a5c]">
                          View Details
                        </Button>
                        <Button variant="outline" className="w-full">
                          Request Info
                        </Button>
                        {club.website && (
                          <Button variant="ghost" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Website
                          </Button>
                        )}
                      </div>
                      
                      {/* Activity Indicators */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Activity Score:</span>
                          <span className="font-medium">{club.activityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discoverability:</span>
                          <span className="font-medium">{club.discoverabilityIndex}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedClubs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}