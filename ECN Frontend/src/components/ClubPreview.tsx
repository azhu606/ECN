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

export function ClubPreview() {
  const clubs = [
    {
      name: "Emory Debate Society",
      category: "Academic",
      description: "Competitive debate team focused on parliamentary and policy debate formats.",
      members: 45,
      rating: 4.8,
      verified: true,
      lastUpdated: "2 days ago",
      meetingTime: "Tuesdays 7-9 PM",
      location: "DUC 204",
      upcomingEvent: "Regional Tournament",
      eventDate: "Oct 15",
      tags: ["Competitive", "Public Speaking", "Critical Thinking"]
    },
    {
      name: "Pre-Med Society",
      category: "Professional",
      description: "Supporting pre-medical students through mentorship and exam preparation.",
      members: 120,
      rating: 4.9,
      verified: true,
      lastUpdated: "1 day ago",
      meetingTime: "Thursdays 6-7:30 PM",
      location: "Chemistry Building",
      upcomingEvent: "MCAT Prep Workshop",
      eventDate: "Oct 12",
      tags: ["Pre-Med", "Study Groups", "Mentorship"]
    },
    {
      name: "Outdoor Adventure Club",
      category: "Recreation",
      description: "Hiking, camping, and outdoor activities around Georgia and beyond.",
      members: 85,
      rating: 4.7,
      verified: true,
      lastUpdated: "3 hours ago",
      meetingTime: "Sundays 2-3 PM",
      location: "Campus Life Pavilion",
      upcomingEvent: "Blue Ridge Hiking Trip",
      eventDate: "Oct 14",
      tags: ["Hiking", "Camping", "Nature"]
    }
  ];

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

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {clubs.map((club, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
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
                    <span className="text-sm font-medium">{club.rating}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {club.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{club.members} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {club.lastUpdated}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{club.meetingTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{club.location}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Upcoming Event</span>
                  </div>
                  <div className="text-sm font-medium text-blue-900">{club.upcomingEvent}</div>
                  <div className="text-xs text-blue-600">{club.eventDate}</div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {club.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    Request Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline">
            Browse All Clubs →
          </Button>
        </div>
      </div>
    </section>
  );
}