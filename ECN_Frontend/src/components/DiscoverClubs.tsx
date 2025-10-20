import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import {
  Search,
  Calendar,
  Users,
  Star,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Clock,
} from "lucide-react";

type NextEvent = {
  name: string;
  date: string; // e.g. "Oct 21"
  time: string; // e.g. "5:30 PM"
  location: string;
} | null;

type Club = {
  id: string;
  name: string;
  description: string | null;
  category: string; // backend returns "General" by default
  school: string[]; // backend returns []
  members: number; // computed from member_ids length
  rating: number; // average from reviews, default 4.6
  verified: boolean;
  lastUpdatedISO: string; // ISO; we format below
  nextEvent: NextEvent; // simplified preview of next upcoming event
  website?: string;
  tags: string[]; // backend returns []
  activityScore: number; // computed
  discoverabilityIndex: number; // computed
};

type ApiClubsResp = {
  items: Club[];
  total: number;
};

const schoolOptions = [
  "All Schools",
  "Business School",
  "Liberal Arts",
  "Public Health",
  "Nursing School",
  "Medical School",
  "Graduate",
  "Undergraduate",
  "Pre-Med",
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
  "Religious",
];

function formatUpdatedAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffHrs = Math.max(0, Math.floor((+now - +d) / (1000 * 60 * 60)));
  if (diffHrs < 24)
    return `${diffHrs || 1} hour${diffHrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(diffHrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DiscoverClubs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("All Schools");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("rating");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch from backend whenever filters change
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (selectedSchool !== "All Schools") params.set("school", selectedSchool);
    if (selectedCategory !== "All Categories")
      params.set("category", selectedCategory);
    if (showVerifiedOnly) params.set("verified", "true");
    params.set("sort", sortBy);
    // pagination example if needed:
    // params.set("limit", "50"); params.set("offset", "0");

    setLoading(true);
    setErr(null);

    fetch(`/api/clubs?${params.toString()}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<ApiClubsResp>;
      })
      .then((data) => {
        setClubs(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setErr(e.message || "Failed to load clubs");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchTerm, selectedSchool, selectedCategory, sortBy, showVerifiedOnly]);

  // Client-side sort fallback (backend already sorts, but keep this as a guard)
  const filteredAndSortedClubs = useMemo(() => {
    const arr = [...clubs];
    arr.sort((a, b) => {
      switch (sortBy) {
        case "discoverability":
          return b.discoverabilityIndex - a.discoverabilityIndex;
        case "members":
          return b.members - a.members;
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "activity":
          return b.activityScore - a.activityScore;
        case "updated":
          return +new Date(b.lastUpdatedISO) - +new Date(a.lastUpdatedISO);
        default:
          return b.discoverabilityIndex - a.discoverabilityIndex;
      }
    });
    return arr;
  }, [clubs, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Discover Clubs
                </h1>
                <p className="text-gray-600 mt-2">
                  {loading
                    ? "Loading…"
                    : `Find your community from ${total} active organizations`}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Ranked by activity & engagement</span>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search clubs, interests, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={selectedSchool}
                  onValueChange={setSelectedSchool}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discoverability">
                      Discoverability
                    </SelectItem>
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
                    onCheckedChange={(v) => setShowVerifiedOnly(Boolean(v))}
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
        {err && <div className="text-red-600 text-sm mb-4">{err}</div>}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredAndSortedClubs.length} of {total} clubs
            </p>
            <div className="text-sm text-gray-500">
              Updated rankings as of today
            </div>
          </div>

          <div className="grid gap-6">
            {filteredAndSortedClubs.map((club, index) => (
              <Card
                key={club.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              #{index + 1}
                            </Badge>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {club.name}
                            </h3>
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
                              <span>{club.rating?.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                Updated {formatUpdatedAgo(club.lastUpdatedISO)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 leading-relaxed">
                        {club.description || "No description yet."}
                      </p>

                      {/* School & Category Tags */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#012169] hover:bg-[#001a5c]">
                          {club.category || "General"}
                        </Badge>
                        {(club.school || []).slice(0, 3).map((school, idx) => (
                          <Badge key={idx} variant="secondary">
                            {school}
                          </Badge>
                        ))}
                        {(club.school || []).length > 3 && (
                          <Badge variant="secondary">
                            +{(club.school || []).length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Interest Tags */}
                      <div className="flex flex-wrap gap-1">
                        {(club.tags || []).map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
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
                          <div className="font-medium text-blue-900">
                            {club.nextEvent.name}
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {club.nextEvent.date} at {club.nextEvent.time}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 flex items-center justify-center">
                                📍
                              </span>
                              <span className="text-xs">
                                {club.nextEvent.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-sm text-gray-500">
                            No upcoming events
                          </span>
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
                          <span className="font-medium">
                            {club.activityScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discoverability:</span>
                          <span className="font-medium">
                            {club.discoverabilityIndex}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && filteredAndSortedClubs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clubs found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
