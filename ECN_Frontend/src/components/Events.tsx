import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Grid,
  List,
  CheckCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

interface Event {
  id: string;
  name: string;
  description: string;
  club: {
    name: string;
    verified: boolean;
  };
  date: string; // "YYYY-MM-DD"
  time: string; // "h:mm AM"
  endTime: string; // "h:mm AM"
  location: string;
  category: string;
  capacity?: number;
  registered: number;
  isRSVPed: boolean;
  tags: string[];
}

const myClubs = [
  "Pre-Medical Society",
  "Computer Science Society",
  "Sustainability Action Network",
];

function formatTimeFromIso(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Events() {
  const { user, anonymousId } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All Categories");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterRSVPed, setFilterRSVPed] = useState(false);
  const [filterMyClubs, setFilterMyClubs] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---- FETCH EVENTS FROM BACKEND ----
  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch(`${API_BASE}/events`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        const mapped: Event[] = (Array.isArray(data) ? data : []).map(
          (e: any): Event => {
            const startIso = e.start_time || e.startTime || e.start || null;
            const endIso = e.end_time || e.endTime || e.end || null;

            const date =
              e.date ||
              (startIso ? new Date(startIso).toISOString().split("T")[0] : "");

            const rawId = e.id ?? e.event_id ?? e.eventId;
            if (!rawId) {
              console.warn("Event missing id field from backend:", e);
            }

            return {
              id: String(rawId),
              name: e.name || e.title || "Untitled Event",
              description: e.description || "",
              club: {
                name:
                  e.clubName || e.club_name || e.club?.name || "Unknown Club",
                verified: Boolean(
                  e.clubVerified ?? e.club_verified ?? e.club?.verified ?? false
                ),
              },
              date,
              time: e.time || formatTimeFromIso(startIso) || "",
              endTime: e.endTime || formatTimeFromIso(endIso) || "",
              location: e.location || "Location TBA",
              category: e.category || "General",
              capacity:
                e.capacity !== undefined
                  ? e.capacity
                  : e.rsvp_limit !== undefined
                  ? e.rsvp_limit
                  : undefined,
              registered:
                e.registered !== undefined
                  ? e.registered
                  : Array.isArray(e.rsvp_ids)
                  ? e.rsvp_ids.length
                  : 0,
              isRSVPed: Boolean(e.isRSVPed || e.user_has_rsvped),
              tags: Array.isArray(e.tags) ? e.tags : [],
            };
          }
        );

        setEvents(mapped);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Failed to load events", err);
        setLoadError(err.message || "Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    return () => controller.abort();
  }, []);

  // ---- RSVP HANDLER (DISABLED UNTIL LOGGED IN) ----
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      alert("Please sign in to RSVP.");
      return;
    }

    // optimistic toggle
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              isRSVPed: !ev.isRSVPed,
              registered: ev.registered + (ev.isRSVPed ? -1 : 1),
            }
          : ev
      )
    );

    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (err) {
      console.error(err);
      alert("RSVP failed on server (UI may be out of sync).");
    }
  };

  const handleShare = (event: Event) => {
    const shareText = `${event.name} - ${event.description}`;
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Link copied to clipboard!");
    }
  };

  const categories = [
    "All Categories",
    "Academic",
    "Professional",
    "Cultural",
    "Environmental",
    "Technology",
    "Recreation",
    "Social",
    "General",
  ];

  // ---- FILTERED EVENTS (UPCOMING TAB) ----
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesSearch =
          !searchTerm ||
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesCategory =
          selectedCategory === "All Categories" ||
          event.category === selectedCategory;

        const matchesDate =
          !selectedDate ||
          event.date === selectedDate.toISOString().split("T")[0];

        const matchesRSVP = !filterRSVPed || event.isRSVPed;

        const matchesMyClubs =
          !filterMyClubs || myClubs.includes(event.club.name);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDate &&
          matchesRSVP &&
          matchesMyClubs
        );
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() +
          (a.time ? 0 : 0) -
          (new Date(b.date).getTime() + (b.time ? 0 : 0))
      );
  }, [
    events,
    searchTerm,
    selectedCategory,
    selectedDate,
    filterRSVPed,
    filterMyClubs,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getCapacityColor = (registered: number, capacity?: number) => {
    if (!capacity) return "text-gray-500";
    const percentage = (registered / capacity) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  // ---- CALENDAR HELPERS ----
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const matchesDate = event.date === dateString;
      const matchesMyClubs =
        !filterMyClubs || myClubs.includes(event.club.name);
      const matchesCategory =
        selectedCategory === "All Categories" ||
        event.category === selectedCategory;
      const matchesRSVP = !filterRSVPed || event.isRSVPed;
      const matchesSearch =
        !searchTerm ||
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return (
        matchesDate &&
        matchesMyClubs &&
        matchesCategory &&
        matchesRSVP &&
        matchesSearch
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const exportToICS = () => {
    const eventsToExport = filteredEvents;
    if (eventsToExport.length === 0) {
      alert("No events to export!");
      return;
    }

    const formatICSDate = (dateStr: string, timeStr: string) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      if (!timeStr) return `${year}${month}${day}T000000`;
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      return `${year}${month}${day}T${String(hours).padStart(2, "0")}${String(
        minutes
      ).padStart(2, "0")}00`;
    };

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Emory Club Nexus//Events Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Emory Club Events",
      "X-WR-TIMEZONE:America/New_York",
    ];

    eventsToExport.forEach((event) => {
      const startDateTime = formatICSDate(event.date, event.time);
      const endDateTime = formatICSDate(
        event.date,
        event.endTime || event.time
      );
      const now =
        new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${event.id}@clubnexus.emory.edu`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `SUMMARY:${event.name}`,
        `DESCRIPTION:${event.description}\\n\\nHosted by: ${
          event.club.name
        }\\nTags: ${event.tags.join(", ")}`,
        `LOCATION:${event.location}`,
        `ORGANIZER;CN=${event.club.name}:MAILTO:noreply@clubnexus.emory.edu`,
        event.isRSVPed ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE",
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `emory-club-events-${
      new Date().toISOString().split("T")[0]
    }.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Successfully exported ${eventsToExport.length} event(s)!`);
  };

  const todayIso = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((ev) => ev.date === todayIso);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Campus Events
                </h1>
                <p className="text-gray-600 mt-2">
                  Discover and join events from across Emory
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-gray-100" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-gray-100" : ""}
                >
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

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* My Events (RSVP) – disabled until logged in */}
              <Button
                variant={filterRSVPed ? "default" : "outline"}
                disabled={!user}
                onClick={() => user && setFilterRSVPed(!filterRSVPed)}
                className={`whitespace-nowrap ${
                  filterRSVPed
                    ? "bg-[#012169] hover:bg-[#001a5c] text-white"
                    : ""
                } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                title={
                  user
                    ? "Show only events you've RSVP'd to"
                    : "Sign in to use My Events filter"
                }
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    filterRSVPed ? "fill-current" : ""
                  }`}
                />
                My Events
              </Button>

              {/* My Clubs – disabled until logged in */}
              <Button
                variant={filterMyClubs ? "default" : "outline"}
                disabled={!user}
                onClick={() => user && setFilterMyClubs(!filterMyClubs)}
                className={`whitespace-nowrap ${
                  filterMyClubs
                    ? "bg-[#012169] hover:bg-[#001a5c] text-white"
                    : ""
                } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                title={
                  user
                    ? "Show only events from clubs you're a member of"
                    : "Sign in to use My Clubs filter"
                }
              >
                <Users
                  className={`w-4 h-4 mr-2 ${
                    filterMyClubs ? "fill-current" : ""
                  }`}
                />
                My Clubs
              </Button>
            </div>

            {loading && (
              <p className="text-sm text-gray-500">Loading events…</p>
            )}
            {loadError && (
              <p className="text-sm text-red-600">Error: {loadError}</p>
            )}
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

          {/* UPCOMING TAB */}
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

            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredEvents.map((event) => {
                const rsvped = event.isRSVPed;

                return (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardContent className="p-6">
                      <div
                        className={
                          viewMode === "grid" ? "space-y-4" : "flex gap-6"
                        }
                      >
                        {/* Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-[#012169]">
                                  {event.category}
                                </Badge>
                                {rsvped && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-200"
                                  >
                                    <Heart className="w-3 h-3 mr-1 fill-current" />
                                    RSVP&apos;d
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {event.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {event.club.name}
                                </span>
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
                              <span>
                                {event.time}
                                {event.endTime ? ` - ${event.endTime}` : ""}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span
                                className={getCapacityColor(
                                  event.registered,
                                  event.capacity
                                )}
                              >
                                {event.registered}
                                {event.capacity ? `/${event.capacity}` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {event.tags.map((tag, idx) => (
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

                        {/* Actions */}
                        <div
                          className={`${
                            viewMode === "grid" ? "w-full" : "w-32"
                          } space-y-2`}
                        >
                          <Button
                            onClick={() => handleRSVP(event.id)}
                            disabled={!user}
                            className={`w-full ${
                              !user
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : rsvped
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-[#012169] hover:bg-[#001a5c]"
                            }`}
                            title={
                              !user
                                ? "Sign in to RSVP"
                                : rsvped
                                ? "Cancel your RSVP"
                                : "RSVP to this event"
                            }
                          >
                            {!user
                              ? "Sign in to RSVP"
                              : rsvped
                              ? "Cancel RSVP"
                              : "RSVP"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleShare(event)}
                          >
                            <Share2 className="w-3 h-3 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!loading && filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </TabsContent>

          {/* TODAY TAB – shows ALL events happening today */}
          <TabsContent value="today" className="space-y-6">
            {todayEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events today
                </h3>
                <p className="text-gray-600">
                  Check the upcoming tab for more events
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {todayEvents.length} event
                  {todayEvents.length !== 1 ? "s" : ""} today
                </p>
                <div className="space-y-4">
                  {todayEvents.map((event) => {
                    const rsvped = event.isRSVPed;
                    return (
                      <Card
                        key={event.id}
                        className="hover:shadow-lg transition-shadow duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-6">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge className="bg-[#012169]">
                                      {event.category}
                                    </Badge>
                                    {rsvped && (
                                      <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-200"
                                      >
                                        <Heart className="w-3 h-3 mr-1 fill-current" />
                                        RSVP&apos;d
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    {event.name}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {event.club.name}
                                    </span>
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
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.time}
                                    {event.endTime ? ` - ${event.endTime}` : ""}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span
                                    className={getCapacityColor(
                                      event.registered,
                                      event.capacity
                                    )}
                                  >
                                    {event.registered}
                                    {event.capacity ? `/${event.capacity}` : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {event.tags.map((tag, idx) => (
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
                            <div className="w-32 space-y-2">
                              <Button
                                onClick={() => handleRSVP(event.id)}
                                disabled={!user}
                                className={`w-full ${
                                  !user
                                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    : rsvped
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-[#012169] hover:bg-[#001a5c]"
                                }`}
                                title={
                                  !user
                                    ? "Sign in to RSVP"
                                    : rsvped
                                    ? "Cancel your RSVP"
                                    : "RSVP to this event"
                                }
                              >
                                {!user
                                  ? "Sign in to RSVP"
                                  : rsvped
                                  ? "Cancel RSVP"
                                  : "RSVP"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleShare(event)}
                              >
                                <Share2 className="w-3 h-3 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* CALENDAR TAB – shows all events, with filters (auth-gated) */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={exportToICS}
                      className="bg-[#012169] hover:bg-[#001a5c] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Calendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("prev")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {/* Days */}
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isCurrentMonthDay = isCurrentMonth(date);
                    const isTodayDate = isToday(date);

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                          !isCurrentMonthDay
                            ? "bg-gray-50 text-gray-400"
                            : "bg-white"
                        } ${
                          isTodayDate
                            ? "bg-blue-50 border-2 border-blue-400 shadow-sm"
                            : ""
                        }`}
                      >
                        {/* Date number */}
                        <div
                          className={`text-sm font-medium mb-1 flex items-center ${
                            isTodayDate
                              ? "text-blue-700 font-bold"
                              : !isCurrentMonthDay
                              ? "text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {isTodayDate ? (
                            <>
                              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                                {date.getDate()}
                              </div>
                              <span className="text-blue-600 text-xs font-medium ml-1">
                                Today
                              </span>
                            </>
                          ) : (
                            date.getDate()
                          )}
                        </div>

                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const rsvped = event.isRSVPed;
                            const isMyClub = myClubs.includes(event.club.name);
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                                  isMyClub
                                    ? "bg-[#012169] text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                } ${rsvped ? "ring-1 ring-green-400" : ""}`}
                                title={`${event.name} - ${event.club.name} at ${event.time}`}
                              >
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate font-medium">
                                    {event.time}
                                  </span>
                                </div>
                                <div className="truncate">{event.name}</div>
                                {isMyClub && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-1"
                                  >
                                    My Club
                                  </Badge>
                                )}
                                {rsvped && (
                                  <div className="flex items-center mt-1">
                                    <Heart className="w-2.5 h-2.5 fill-current text-green-400" />
                                    <span className="ml-1 text-xs">
                                      RSVP&apos;d
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

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

                {/* Calendar filters + legend */}
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Quick Filters:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant={filterMyClubs ? "default" : "outline"}
                        size="sm"
                        disabled={!user}
                        onClick={() => user && setFilterMyClubs(!filterMyClubs)}
                        className={`text-sm ${
                          filterMyClubs
                            ? "bg-[#012169] hover:bg-[#001a5c] text-white"
                            : "hover:bg-gray-50"
                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="w-3 h-3 bg-[#012169] rounded mr-2" />
                        My Clubs Events
                      </Button>

                      <Button
                        variant={filterRSVPed ? "default" : "outline"}
                        size="sm"
                        disabled={!user}
                        onClick={() => user && setFilterRSVPed(!filterRSVPed)}
                        className={`text-sm ${
                          filterRSVPed
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:bg-gray-50"
                        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Heart
                          className={`w-3 h-3 mr-2 ${
                            filterRSVPed
                              ? "fill-current text-white"
                              : "text-green-400 fill-current"
                          }`}
                        />
                        RSVP&apos;d Events
                      </Button>

                      <Button
                        variant={
                          selectedDate &&
                          selectedDate.toDateString() ===
                            new Date().toDateString()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          if (
                            selectedDate &&
                            selectedDate.toDateString() === today.toDateString()
                          ) {
                            setSelectedDate(undefined);
                          } else {
                            setSelectedDate(today);
                          }
                        }}
                        className={`text-sm ${
                          selectedDate &&
                          selectedDate.toDateString() ===
                            new Date().toDateString()
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-3 h-3 bg-blue-50 border-2 border-blue-400 rounded mr-2" />
                        Today&apos;s Events
                      </Button>

                      {(filterRSVPed ||
                        filterMyClubs ||
                        (selectedDate &&
                          selectedDate.toDateString() ===
                            new Date().toDateString())) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilterRSVPed(false);
                            setFilterMyClubs(false);
                            setSelectedDate(undefined);
                          }}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Event Types:
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-[#012169] rounded" />
                        <span>My Clubs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-100 border rounded" />
                        <span>Other Clubs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="w-3 h-3 text-green-400 fill-current" />
                        <span>RSVP&apos;d</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-50 border-2 border-blue-400 rounded" />
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {(filterRSVPed ||
                    filterMyClubs ||
                    (selectedDate &&
                      selectedDate.toDateString() ===
                        new Date().toDateString())) && (
                    <div className="text-xs text-gray-500 italic">
                      Active filters:
                      {filterMyClubs && " My Clubs"}
                      {filterRSVPed && " • RSVP&apos;d Events"}
                      {selectedDate &&
                        selectedDate.toDateString() ===
                          new Date().toDateString() &&
                        " • Today&apos;s Events"}
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
