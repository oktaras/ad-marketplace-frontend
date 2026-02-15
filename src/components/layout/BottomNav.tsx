import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, HandshakeIcon, Radio, FileText, User } from "lucide-react";
import { Text } from "@telegram-tools/ui-kit";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";

export function BottomNav() {
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const briefsTab = { id: "briefs", label: "Briefs", icon: FileText, path: "/briefs" };
  const listingsTab = { id: "listings", label: "Listings", icon: Radio, path: "/listings" };
  const myBriefsTab = { id: "my-briefs", label: "My Briefs", icon: FileText, path: "/my-briefs" };
  const myChannelsTab = { id: "my-channels", label: "My Channels", icon: Briefcase, path: "/my-channels" };

  const homeTab = (() => {
    switch (role) {
      case "advertiser":
        return listingsTab;
      case "publisher":
        return briefsTab;
      default:
        return { id: "home", label: "Home", icon: FileText, path: "/" };
    }
  })();

  const myTab = (() => {
    switch (role) {
      case "advertiser":
        return myBriefsTab;
      case "publisher":
        return myChannelsTab;
      default:
        return { id: "my-stuff", label: "My Stuff", icon: Briefcase, path: "/my-stuff" };
    }
  })();

  const tabs = [
    homeTab,
    myTab,
    { id: "deals", label: "Deals", icon: HandshakeIcon, path: "/deals" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ] as const;

  const activeTab = tabs.find(
    (tab) => tab.path === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.path)
  )?.id ?? tabs[0].id;

  return (
    <nav className="safe-area-bottom safe-area-x fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <Text type="caption2" weight={isActive ? "medium" : "regular"} color={isActive ? "accent" : "secondary"}>
                {tab.label}
              </Text>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
