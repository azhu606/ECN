import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Users, Settings, TrendingUp, Shield } from "lucide-react";

export function CallToAction() {
  return (
    <section className="py-20 bg-[#012169] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Transform Club Life at Emory?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Whether you're a student looking for your community or an officer wanting to grow your club, 
            ECN provides the tools you need to succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* For Students */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-300" />
                <h3 className="text-2xl font-bold text-white">For Students</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Find clubs that match your interests and schedule</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Connect with verified contacts and current members</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Never miss events with our live campus calendar</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Read reviews from fellow students</p>
                </div>
              </div>

              <Button size="lg" className="w-full bg-white text-[#012169] hover:bg-gray-100">
                Start Exploring Clubs
              </Button>
            </CardContent>
          </Card>

          {/* For Officers */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-blue-300" />
                <h3 className="text-2xl font-bold text-white">For Club Officers</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Manage your club profile with verified badges</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Post events with automatic campus calendar integration</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Track engagement with analytics dashboard</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2"></div>
                  <p className="text-blue-100">Reduce repetitive inquiries with up-to-date info</p>
                </div>
              </div>

              <Button size="lg" variant="outline" className="w-full border-white text-white hover:bg-white hover:text-[#012169]">
                Claim Your Club
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <Shield className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="text-2xl font-bold">NetID</div>
            <div className="text-sm text-blue-200">Secure Authentication</div>
          </div>
          <div className="space-y-2">
            <TrendingUp className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="text-2xl font-bold">95%+</div>
            <div className="text-sm text-blue-200">Verified Contacts</div>
          </div>
          <div className="space-y-2">
            <Users className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-blue-200">Active Clubs</div>
          </div>
          <div className="space-y-2">
            <Shield className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="text-2xl font-bold">WCAG</div>
            <div className="text-sm text-blue-200">2.1 AA Compliant</div>
          </div>
        </div>
      </div>
    </section>
  );
}