import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Clock, 
  MapPin, 
  Users, 
  Star,
  CheckCircle,
  Calendar
} from "lucide-react";

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
  nextEvent: {
    name: string;
    date: string;
    time: string;
    location: string;
  } | null;
  tags: string[];
};

function formatUpdatedAgo(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const now = new Date();
  const diffHrs = Math.max(0, Math.floor((+now - +d) / (1000 * 60 * 60)));
  if (diffHrs < 24) return `${diffHrs || 1} hour${diffHrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(diffHrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ClubPreview() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top 3 clubs sorted by rating
    fetch("/api/clubs?sort=rating&limit=3")
      .then((res) => res.json())
      .then((data) => {
        setClubs(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load clubs:", err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Discover Your Perfect Club
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse verified, up-to-date club profiles with all the information you need to make connections.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading clubs...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No clubs available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-6 mb-12">
              {clubs.map((club) => (
                <Card key={club.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          {club.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {club.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{club.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {club.description || "No description available."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{club.members} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatUpdatedAgo(club.lastUpdatedISO)}</span>
                      </div>
                    </div>

                    {club.nextEvent && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900">Upcoming Event</span>
                        </div>
                        <div className="text-sm font-medium text-blue-900">{club.nextEvent.name}</div>
                        <div className="text-xs text-blue-600">{club.nextEvent.date}</div>
                      </div>
                    )}

                    {club.tags && club.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {club.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/discover?clubId=${club.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/discover?clubId=${club.id}`)}
                      >
                        Request Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/discover")}
              >
                Browse All Clubs →
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}