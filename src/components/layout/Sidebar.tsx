import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Handshake, 
  BarChart3,
  Target,
  Calendar,
  CheckSquare,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border shadow-medium">
      <div className="flex h-16 items-center justify-center border-b border-border bg-gradient-secondary">
        <div className="flex items-center space-x-2">
          <img 
            src="/src/image/wslogo.png" 
            alt="WS Deal Dash Logo" 
            className="h-8 w-8"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary">
              WS Deal Dash
            </span>
            <span className="text-xs text-muted-foreground">Luxury CRM</span>
          </div>
        </div>
      </div>
      
      <TooltipProvider>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105",
                  isActive
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-soft"
                )
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M7 7h10v10H7z"/></svg>
            EOD Admin
          </Link>
        </nav>
      </TooltipProvider>
    </div>
  );
}