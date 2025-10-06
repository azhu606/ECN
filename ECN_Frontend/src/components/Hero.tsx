import React from "react";


import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Users, Calendar, Shield } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Find Your Community at{" "}
                <span className="text-[#012169]">Emory</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover clubs, connect with verified contacts, and never miss an event. 
                ECN makes it effortless to find your people and build lasting connections.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-lg shadow-lg max-w-md">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <Input 
                  placeholder="Search clubs, events, interests..." 
                  className="border-0 focus-visible:ring-0 bg-transparent"
                />
                <Button size="sm">Search</Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600">500+ Active Clubs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600">Live Events Feed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#012169]" />
                <span className="text-sm text-gray-600">Verified Contacts</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-[#012169] hover:bg-[#001a5c]">
                Browse Clubs
              </Button>
              <Button size="lg" variant="outline">
                Upcoming Events
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1693011142814-aa33d7d1535c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwc3R1ZGVudHN8ZW58MXx8fHwxNzU4MDk0MjAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Students on campus"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-lg shadow-lg">
              <div className="text-sm font-semibold text-gray-900">📅 This Week</div>
              <div className="text-xs text-gray-600">25 Events</div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-lg">
              <div className="text-sm font-semibold text-gray-900">🎯 Perfect Match</div>
              <div className="text-xs text-gray-600">Based on your interests</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}