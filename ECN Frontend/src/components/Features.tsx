import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Search, 
  Shield, 
  Calendar, 
  Users, 
  MessageSquare, 
  BarChart3,
  Clock,
  Star
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Search,
      title: "Smart Discovery",
      description: "Advanced search with filters for interests, meeting times, commitment levels, and more.",
      badge: "MVP",
      color: "bg-blue-500"
    },
    {
      icon: Shield,
      title: "Verified Contacts",
      description: "Always up-to-date officer information with freshness badges and automated nudges.",
      badge: "MVP",
      color: "bg-green-500"
    },
    {
      icon: Calendar,
      title: "Live Events Feed",
      description: "Campus-wide calendar with RSVP functionality and automatic event surfacing.",
      badge: "MVP",
      color: "bg-purple-500"
    },
    {
      icon: Users,
      title: "Club Profiles",
      description: "Rich club pages with purpose, activities, media, and member testimonials.",
      badge: "MVP",
      color: "bg-orange-500"
    },
    {
      icon: MessageSquare,
      title: "Reviews & Ratings",
      description: "Moderated student feedback to help others find the right community fit.",
      badge: "V2",
      color: "bg-pink-500"
    },
    {
      icon: BarChart3,
      title: "Officer Dashboard",
      description: "Analytics and insights to help clubs grow engagement and track health metrics.",
      badge: "V2",
      color: "bg-indigo-500"
    },
    {
      icon: Clock,
      title: "Freshness Tracking",
      description: "Automatic detection of stale data with gentle nudges to keep information current.",
      badge: "MVP",
      color: "bg-teal-500"
    },
    {
      icon: Star,
      title: "Interest Matching",
      description: "AI-powered recommendations based on your interests and involvement history.",
      badge: "V2",
      color: "bg-yellow-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Everything You Need to Connect
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ECN combines modern technology with thoughtful design to make club discovery 
            and engagement effortless for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${feature.color} bg-opacity-10`}>
                      <IconComponent className={`w-5 h-5 ${feature.color.replace('bg-', 'text-')}`} />
                    </div>
                    <Badge 
                      variant={feature.badge === "MVP" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}