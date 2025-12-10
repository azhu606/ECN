import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";

import {
  Search,
  Calendar,
  Users,
  Star,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Clock,
  Mail,
  MapPin,
  Globe,
  Activity,
  ArrowDown,
  X,
} from "lucide-react";

type NextEvent =
  | {
      name: string;
      date: string;
      time: string;
      location: string;
    }
  | null;

type Club = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  school: string[];
  members: number;
  rating: number;
  verified: boolean;
  lastUpdatedISO: string;
  nextEvent: NextEvent;
  website?: string;
  tags: string[];
  activityScore: number;
  discoverabilityIndex: number;

  // extra optional fields used only in the details view
  fullDescription?: string | null;
  contactEmail?: string | null;
  meetingInfo?: string | null;
  officers?: {
    president: { name: string; email: string };
    officers: { name: string; email: string; role: string }[];
  };
};

type ApiClubsResp = {
  items: Club[];
  total: number;
};

// shape returned by GET /api/clubs/<uuid>/profile
type ClubProfile = {
  id: string;
  name: string;
  description: string | null;
  purpose: string | null;
  activities: string | null;
  mediaUrls: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  requestInfoFormUrl: string | null;
  status: string;
  verified: boolean;
  lastUpdatedAt: string | null;
  updateRecencyBadge: string | null;
  officers?: {
    president: { name: string; email: string } | null;
    officers: { name: string; email: string; role: string }[];
  } | null;
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
  if (!iso) return "N/A";
  const d = new Date(iso);
  const now = new Date();
  const diffHrs = Math.max(0, Math.floor((+now - +d) / (1000 * 60 * 60)));
  if (diffHrs < 24)
    return `${diffHrs || 1} hour${diffHrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(diffHrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DiscoverClubs() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const initialVerified = searchParams.get("verified") === "true";
  const clubIdFromUrl = searchParams.get("clubId");
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSchool, setSelectedSchool] = useState("All Schools");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("rating");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(initialVerified);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // which club is expanded (its compact card is replaced by details)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  // track which club is loading details from /profile
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  // ---------------------------------------------------------------------
  // BACKEND FETCH FOR LIST OF CLUBS
  // ---------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (selectedSchool !== "All Schools") params.set("school", selectedSchool);
    if (selectedCategory !== "All Categories")
      params.set("category", selectedCategory);
    if (showVerifiedOnly) params.set("verified", "true");
    params.set("sort", sortBy);

    setLoading(true);
    setErr(null);

    fetch(`/api/clubs?${params.toString()}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as ApiClubsResp;
      })
      .then((data) => {
        setClubs(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((e: any) => {
        if (e.name !== "AbortError") {
          console.error("Failed to load clubs", e);
          setErr(e.message || "Failed to load clubs");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchTerm, selectedSchool, selectedCategory, sortBy, showVerifiedOnly]);

  // ---------------------------------------------------------------------
  // AUTO-OPEN CLUB DETAILS IF clubId IS IN URL
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (clubIdFromUrl && clubs.length > 0 && !selectedClub) {
      const club = clubs.find((c) => c.id === clubIdFromUrl);
      if (club) {
        handleViewDetails(club);
      }
    }
  }, [clubIdFromUrl, clubs, selectedClub]);

  // ---------------------------------------------------------------------
  // VIEW DETAILS -> fetch /api/clubs/:id/profile and merge into Club
  // ---------------------------------------------------------------------
  const handleViewDetails = (club: Club) => {
    setLoadingDetailsId(club.id);

    (async () => {
      try {
        const res = await fetch(`/api/clubs/${club.id}/profile`);
        if (!res.ok) {
          console.warn("Profile fetch failed, falling back to list club");
          setSelectedClub(club);
          return;
        }

        const profile: ClubProfile = await res.json();

        const mergedClub: Club = {
          ...club,
          // Prefer purpose/description from profile as our "fullDescription"
          fullDescription:
            profile.purpose ??
            profile.description ??
            club.fullDescription ??
            club.description,
          contactEmail: profile.contactEmail ?? club.contactEmail,
          // Merge officers data from backend profile
          officers: profile.officers ?? club.officers,
          verified:
            typeof profile.verified === "boolean"
              ? profile.verified
              : club.verified,
          lastUpdatedISO:
            profile.lastUpdatedAt ?? club.lastUpdatedISO ?? new Date().toISOString(),
        };

        setSelectedClub(mergedClub);
      } catch (e) {
        console.error("Error loading club profile", e);
        setSelectedClub(club);
      } finally {
        setLoadingDetailsId(null);
        setTimeout(() => {
          const el = document.getElementById(`club-details-${club.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    })();
  };

  // When user clicks "Request Info" from the compact list card, the
  // list item may not include `contactEmail`. Fetch the club profile
  // and use the profile's contact email (if available) before opening
  // a mailto: link — matching the behavior used in the detailed view.
  const handleRequestInfo = async (club: Club) => {
    try {
      // Prefer contactEmail already present on the list item
      let email = club.contactEmail;

      if (!email) {
        const res = await fetch(`/api/clubs/${club.id}/profile`);
        if (res.ok) {
          const profile: ClubProfile = await res.json();
          email = profile.contactEmail ?? undefined;
        }
      }

      if (email) {
        const template = `\nHello,\n\nI hope you are doing well. I’m reaching out because I’m interested in learning more about your organization, ${club.name}.\n\nCould you please provide more information about upcoming events, membership requirements, and how to get involved?\n\nThank you!\n`.trim();

        window.location.href = `mailto:${email}?subject=${encodeURIComponent(
          "Request for Information - " + club.name
        )}&body=${encodeURIComponent(template)}`;
      } else {
        alert("No contact email available for this club");
      }
    } catch (e) {
      console.error("Failed to fetch profile for request info", e);
      // Fallback: if club.contactEmail existed earlier it would have been used,
      // otherwise surface the alert to the user.
      alert("Unable to open email composer right now");
    }
  };

  const filteredAndSortedClubs = useMemo(() => {
    const arr = [...clubs];

    arr.sort((a, b) => {
      switch (sortBy) {
        case "discoverability":
          return (b.discoverabilityIndex || 0) - (a.discoverabilityIndex || 0);
        case "members":
          return (b.members || 0) - (a.members || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "activity":
          return (b.activityScore || 0) - (a.activityScore || 0);
        case "updated":
          return +new Date(b.lastUpdatedISO) - +new Date(a.lastUpdatedISO);
        default:
          return (b.discoverabilityIndex || 0) - (a.discoverabilityIndex || 0);
      }
    });

    const term = searchTerm.toLowerCase();

    return arr.filter((club) => {
      const matchesSearch =
        !term ||
        club.name.toLowerCase().includes(term) ||
        (club.description || "").toLowerCase().includes(term) ||
        (club.tags || []).some((t) => t.toLowerCase().includes(term));

      const matchesSchool =
        selectedSchool === "All Schools" ||
        (club.school || []).includes(selectedSchool);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        club.category === selectedCategory;

      const matchesVerified = !showVerifiedOnly || club.verified;

      return (
        matchesSearch && matchesSchool && matchesCategory && matchesVerified
      );
    });
  }, [
    clubs,
    sortBy,
    searchTerm,
    selectedSchool,
    selectedCategory,
    showVerifiedOnly,
  ]);

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
            {filteredAndSortedClubs.map((club, index) => {
              const isSelected = selectedClub?.id === club.id;

              return (
                <React.Fragment key={club.id}>
                  {/* If not selected, show compact summary card */}
                  {!isSelected && (
                    <Card className="hover:shadow-lg transition-shadow duration-200">
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
                                    <span>{club.rating.toFixed(1)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      Updated{" "}
                                      {formatUpdatedAgo(club.lastUpdatedISO)}
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
                              {(club.school || [])
                                .slice(0, 3)
                                .map((school, idx) => (
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
                                      {club.nextEvent.date} at{" "}
                                      {club.nextEvent.time}
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
                              <Button
                                className="w-full bg-[#012169] hover:bg-[#001a5c]"
                                onClick={() => handleViewDetails(club)}
                                disabled={loadingDetailsId === club.id}
                              >
                                {loadingDetailsId === club.id
                                  ? "Loading…"
                                  : "View Details"}
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleRequestInfo(club)}
                              >
                                Request Info
                              </Button>

                              {club.website && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                >
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
                  )}

                  {/* If selected, show ONLY the detailed view (no compact card) */}
                  {isSelected && selectedClub && (
                    <div
                      id={`club-details-${selectedClub.id}`}
                      className="bg-white border rounded-xl shadow-sm"
                    >
                      {(() => {
                        // Use selectedClub for rendering to get merged data (including officers)
                        const club = selectedClub;
                        return (
                          <>
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
                              <span>{club.members} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{club.rating.toFixed(1)} rating</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="w-4 h-4" />
                              <span>
                                Discoverability: {club.discoverabilityIndex}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 rounded-full hover:bg-gray-100"
                            onClick={() => setSelectedClub(null)}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Tabs with About / Leadership / Contact & Events */}
                      <div className="px-6 pb-6">
                        <Tabs defaultValue="about" className="mt-4">
                          <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="leadership">
                              Leadership
                            </TabsTrigger>
                            <TabsTrigger value="contact">
                              Contact &amp; Events
                            </TabsTrigger>
                          </TabsList>

                          {/* ABOUT TAB */}
                          <TabsContent value="about" className="mt-6 space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle>About {club.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="prose max-w-none">
                                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                    {club.fullDescription ||
                                      club.description ||
                                      "No description available."}
                                  </p>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      Category &amp; Affiliations
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className="bg-[#012169]">
                                        {club.category || "General"}
                                      </Badge>
                                      {(club.school || []).map(
                                        (school, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                          >
                                            {school}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      Interest Areas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(club.tags || []).map((tag, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900">
                                      Activity Metrics
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Activity Score:
                                        </span>
                                        <span className="font-medium">
                                          {club.activityScore}/100
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Discoverability Index:
                                        </span>
                                        <span className="font-medium">
                                          {club.discoverabilityIndex}/100
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Last Updated:
                                        </span>
                                        <span className="font-medium">
                                          {formatUpdatedAgo(
                                            club.lastUpdatedISO
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {club.meetingInfo && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-gray-900">
                                        Meeting Information
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {club.meetingInfo}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* LEADERSHIP TAB */}
                          <TabsContent
                            value="leadership"
                            className="mt-6 space-y-6"
                          >
                            <Card>
                              <CardHeader>
                                <CardTitle>Leadership Structure</CardTitle>
                              </CardHeader>
                              <CardContent className="p-8">
                                {club.officers && (club.officers.president || (club.officers.officers && club.officers.officers.length > 0)) ? (
                                  <div className="flex flex-col items-center space-y-8">
                                    {/* President */}
                                    {club.officers.president && (
                                      <>
                                        <div className="flex flex-col items-center">
                                          <div className="w-72 p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-600 rounded-lg shadow-lg">
                                            <div className="flex items-center space-x-3 mb-3">
                                              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-gray">
                                                <Users className="w-6 h-6" />
                                              </div>
                                              <Badge className="bg-purple-600 text-yellow-600">
                                                President
                                              </Badge>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900">
                                              {club.officers.president.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 break-all">
                                              {club.officers.president.email}
                                            </p>
                                          </div>

                                          {club.officers.officers && club.officers.officers.length > 0 && (
                                            <ArrowDown className="w-6 h-6 text-gray-400 my-4" />
                                          )}
                                        </div>
                                      </>
                                    )}

                                    {/* Officers */}
                                    {club.officers.officers && club.officers.officers.length > 0 && (
                                      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
                                        {club.officers.officers.map(
                                          (officer, idx) => (
                                            <div
                                              key={idx}
                                              className="flex flex-col items-center"
                                            >
                                              <div className="w-full p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg shadow-md">
                                                <div className="flex items-center space-x-2 mb-3">
                                                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                                    <Users className="w-5 h-5" />
                                                  </div>
                                                  <Badge className="bg-blue-600 text-xs">
                                                    Officer
                                                  </Badge>
                                                </div>
                                                <h3 className="font-semibold text-gray-900">
                                                  {officer.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 break-all">
                                                  {officer.email}
                                                </p>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-12 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p>Leadership information not available</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* CONTACT & EVENTS TAB */}
                          <TabsContent
                            value="contact"
                            className="mt-6 space-y-6"
                          >
                            <div className="grid md:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {club.contactEmail && (
                                    <div className="flex items-start space-x-3">
                                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          Email
                                        </div>
                                        <a
                                          href={`mailto:${club.contactEmail}`}
                                          className="text-sm text-blue-600 hover:underline"
                                        >
                                          {club.contactEmail}
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {club.website && (
                                    <div className="flex items-start space-x-3">
                                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          Website
                                        </div>
                                        <a
                                          href={club.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:underline"
                                        >
                                          {club.website}
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {club.meetingInfo && (
                                    <div className="flex items-start space-x-3">
                                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          Meetings
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {club.meetingInfo}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <Separator />

                                  <Button
                                    className="w-full"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (club.contactEmail) {
                                        window.location.href = `mailto:${club.contactEmail}?subject=Request for Information - ${club.name}`;
                                      } else {
                                        alert('No contact email available for this club');
                                      }
                                    }}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Request More Information
                                  </Button>

                                
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle>Next Event</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {club.nextEvent ? (
                                    <div className="space-y-4">
                                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-blue-900">
                                          {club.nextEvent.name}
                                        </h4>
                                        <div className="space-y-2 text-sm text-blue-700">
                                          <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                              {club.nextEvent.date} at{" "}
                                              {club.nextEvent.time}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>
                                              {club.nextEvent.location}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button className="w-full bg-[#012169] hover:bg-[#001a5c]">
                                        RSVP to Event
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                      <p className="text-sm text-gray-500">
                                        No upcoming events scheduled
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </>
                    );
                  })()}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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

