import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#012169] text-white rounded flex items-center justify-center text-sm font-bold">
                E
              </div>
              <div>
                <div className="font-semibold text-white">Club Nexus</div>
                <div className="text-xs text-gray-400">Emory University</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Making it effortless for every Emory student to discover, evaluate, 
              and join the right clubs while keeping club data accurate and alive.
            </p>
          </div>

          {/* Students */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Students</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Discover Clubs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Browse Events</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Read Reviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interest Matching</a></li>
            </ul>
          </div>

          {/* Officers */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Officers</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Manage Profile</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Post Events</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Analytics Dashboard</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Update Contacts</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact SILT</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-400">
            © 2024 Emory Club Nexus. Part of Student Involvement & Leadership.
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>Built for Emory Students</span>
            <span>•</span>
            <span>NetID Authentication</span>
            <span>•</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}